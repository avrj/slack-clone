const passportSocketIo = require('passport.socketio');
const events = require('./events');

const User = require('./models/User');
const Channel = require('./models/Channel');
const Message = require('./models/Message');


module.exports = function (io) {
    io.sockets.on('connection', (socket) => {
        joinSavedChannels(socket.request.user, socket);

        const connectedClientsForUser = passportSocketIo.filterSocketsByUser(io, user => user === socket.request.user);

        if (connectedClientsForUser.length <= 1) {
            socket.broadcast.emit(events.online, socket.request.user);

            User.findOneAndUpdate(
                {'local.username': socket.request.user},
                {'local.online': true}).exec()
                .then(() => console.log(`${socket.request.user} is now online with client ${socket.id}`));
        } else {
            console.log(`${socket.request.user} is now connected with new client ${socket.id}`);
        }

        socket.on(events.join, handleJoin);
        socket.on(events.leave, handleLeave);
        socket.on(events.msg, handleMsg);
        socket.on(events.privateMsg, handlePrivateMsg);
        socket.on(events.disconnect, handleDisconnect);

        function handleJoin(room) {
            Channel.findOne({name: room}, (err, channel) => {
                if (channel) {
                    User.findOne({'local.username': socket.request.user, 'local.channels': room}).exec()
                        .then(user => {
                            if (user) {
                                console.log(`${socket.request.user} is already joined to ${room}`);
                            } else {
                                connectedClientsForUser.forEach((socket1) => {
                                    socket1.join(room);
                                    socket1.emit(events.join, room);
                                });

                                return User.findOneAndUpdate(
                                    {'local.username': socket.request.user},
                                    {$push: {'local.channels': room}}).exec()
                            }
                        })
                        .then(() => {
                            console.log(`${socket.request.user} (${socket.id}) joined room ${room}`);
                        });
                } else {
                    connectedClientsForUser.forEach((socket1) => {
                        socket1.join(room);
                        socket1.emit(events.join, room);
                    });

                    const newChannel = new Channel();

                    newChannel.name = room;

                    newChannel.save()
                        .then(() => {
                            return User.findOneAndUpdate(
                                {'local.username': socket.request.user},
                                {$push: {'local.channels': room}}).exec()
                        })
                        .then(() => console.log(`${socket.request.user} (${socket.id}) joined room ${room}`));
                }
            });
        }

        function handleLeave(room) {
            User.findOne({'local.username': socket.request.user, 'local.channels': room}).exec()
                .then(user => {
                    if (user) {
                        connectedClientsForUser.forEach((socket1) => {
                            socket1.leave(room);
                            socket1.emit(events.leave, room);
                        });

                        return User.findOneAndUpdate(
                            {'local.username': socket.request.user},
                            {$pull: {'local.channels': room}})
                    } else {
                        throw (`${socket.request.user} is not joined to ${room}`);
                    }
                })
                .then(() => {
                    console.log(`${socket.request.user} (${socket.id}) leaved room ${room}`);
                })
                .then(null, (error) => console.log(error));
        }

        function handleMsg(data) {
            if (!data.room) {
                console.log('no room selected');
                return;
            }

            if (!socket.rooms[data.room]) {
                console.log('not joined to room');
                return;
            }


            const msgData = {
                date: Date.now(),
                room: data.room,
                user: socket.request.user,
                msg: data.msg,
            };

            socket.broadcast.to(data.room).emit(events.msg, msgData);
            socket.emit(events.msg, msgData);

            const newMessage = new Message();

            newMessage.user = socket.request.user;
            newMessage.text = data.msg;
            newMessage.channel = data.room;

            newMessage.save()
                .then(() => console.log(`${socket.request.user} (${socket.id}) sent message ${data.msg} to channel ${data.room}`))
                .then(null, (error) => console.log(error));
        }

        function handlePrivateMsg(data) {
            if (!data.to) return;

            console.log(`${socket.request.user} (${socket.id}) sent private message ${data.msg} to ${data.to}`);

            /* send private msg to all clients of receiver if receiver is not the sender */
            if (data.to !== socket.request.user) {
                passportSocketIo.filterSocketsByUser(io, user => user === data.to).forEach((socket1) => {
                    socket1.emit(events.privateMsg, {
                        from: socket.request.user,
                        msg: data.msg,
                    });
                });
            }

            /* send copy of privatemsg to all clients of sender */
            connectedClientsForUser.forEach((socket1) => {
                socket1.emit(events.ownPrivateMsg, {
                    to: data.to,
                    msg: data.msg,
                });
            });
        }

        function handleDisconnect() {
            if (connectedClientsForUser.length < 1) {
                User.findOneAndUpdate(
                    {'local.username': socket.request.user},
                    {'local.online': false}).exec()
                    .then(() => {
                        console.log(`${socket.request.user} (${socket.id}) is now offline`);

                        socket.broadcast.emit(events.offline, socket.request.user);
                    })
            } else {
                console.log(`${socket.request.user} (${socket.id}) one of clients has disconnected`);
            }
        }

        function joinSavedChannels(nick, socket) {
            User.findOne(
                {'local.username': socket.request.user},
                {'local.channels': 1}).exec()
                .then((user) => {
                    user.local.channels.map((channel) => {
                        socket.join(channel);
                        //socket.emit(events.join, channel);
                    });
                })
        }
    });
};
