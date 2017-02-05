const passportSocketIo = require('passport.socketio');
const debug = require('debug')('chat');

const events = require('./events');
const models = require('./models');

module.exports = function (config, io) {
    io.sockets.on('connection', (socket) => {
        socket.request.user = socket.request.user.toLowerCase();

        joinSavedChannels(socket.request.user, socket);

        const connectedClientsForUser = passportSocketIo.filterSocketsByUser(io, user => user === socket.request.user);

        if (connectedClientsForUser.length <= 1) {
            socket.broadcast.emit(events.online, socket.request.user);

            models.User.findOneAndUpdate(
                {'local.username': socket.request.user},
                {'local.online': true}).exec()
                .then(() => debug(`${socket.request.user} is now online with client ${socket.id}`));
        } else {
            debug(`${socket.request.user} is now connected with new client ${socket.id}`);
        }

        socket.on(events.join, handleJoin);
        socket.on(events.leave, handleLeave);
        socket.on(events.msg, handleMsg);
        socket.on(events.privateMsg, handlePrivateMsg);
        socket.on(events.disconnect, handleDisconnect);

        function handleJoin(channelToJoin) {
            if (!channelToJoin) {
                debug('error joining channel: no channel specified');
                return;
            }

            channelToJoin = channelToJoin.toLowerCase();

            models.Channel.findOne({name: channelToJoin}, (err, channel) => {
                if (channel) {
                    models.User.findOne({'local.username': socket.request.user, 'local.channels': channelToJoin}).exec()
                        .then((user) => {
                            if (user) {
                                debug(`error joining channel: ${socket.request.user} is already joined to ${channelToJoin}`);
                            } else {
                                connectedClientsForUser.forEach((socket1) => {
                                    socket1.join(channelToJoin);
                                    socket1.emit(events.join, channelToJoin);
                                });

                                return models.User.findOneAndUpdate(
                                    {'local.username': socket.request.user},
                                    {$push: {'local.channels': channelToJoin}}).exec();
                            }
                        })
                        .then(() => {
                            debug(`${socket.request.user} (${socket.id}) joined channel ${channelToJoin}`);
                        });
                } else {
                    connectedClientsForUser.forEach((socket1) => {
                        socket1.join(channelToJoin);
                        socket1.emit(events.join, channelToJoin);
                    });

                    const newChannel = new models.Channel();

                    newChannel.name = channelToJoin;

                    newChannel.save()
                        .then(() => models.User.findOneAndUpdate(
                            {'local.username': socket.request.user},
                            {$push: {'local.channels': channelToJoin}}).exec())
                        .then(() => debug(`${socket.request.user} (${socket.id}) joined channel ${channelToJoin}`));
                }
            });
        }

        function handleLeave(channel) {
            if (!channel) {
                debug('error leaving channel: no channel specified');

                return;
            }

            if (channel == config.defaultChannel) {
                debug('can\'t leave the default channel');

                return;
            }

            channel = channel.toLowerCase();


            models.User.findOne({'local.username': socket.request.user, 'local.channels': channel}).exec()
                .then((user) => {
                    if (user) {
                        connectedClientsForUser.forEach((socket1) => {
                            socket1.leave(channel);
                            socket1.emit(events.leave, channel);
                        });

                        return models.User.findOneAndUpdate(
                            {'local.username': socket.request.user},
                            {$pull: {'local.channels': channel}});
                    }
                    throw (`${socket.request.user} is not joined to ${channel}`);
                })
                .then(() => {
                    debug(`${socket.request.user} (${socket.id}) leaved channel ${channel}`);
                })
                .then(null, error => debug(`error leaving channel: ${error}`));
        }

        function handleMsg(data) {
            if (!data.room) {
                debug('error sending message: no channel selected');
                return;
            }

            if (!socket.rooms[data.room]) {
                debug('error sending message: not joined to channel');
                return;
            }

            if (!data.msg) {
                debug('error sending message: no message specified');
                return;
            }

            data.room = data.room.toLowerCase();

            const msgData = {
                date: Date.now(),
                room: data.room,
                user: socket.request.user,
                msg: data.msg,
            };

            socket.broadcast.to(data.room).emit(events.msg, msgData);
            socket.emit(events.msg, msgData);

            const newMessage = new models.Message();

            newMessage.user = socket.request.user;
            newMessage.text = data.msg;
            newMessage.channel = data.room;

            newMessage.save()
                .then(() => debug(`${socket.request.user} (${socket.id}) sent message ${data.msg} to channel ${data.room}`))
                .then(null, error => debug(`error sending message: ${error}`));
        }

        function handlePrivateMsg(data) {
            if (!data.to) {
                debug('error sending private message: no receiver specified');
                return;
            }


            if (!data.msg) {
                debug('error sending private message: no message specified');
                return;
            }

            data.to = data.to.toLowerCase();

            debug(`${socket.request.user} (${socket.id}) sent private message ${data.msg} to ${data.to}`);

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
            if (connectedClientsForUser.length <= 1) {
                models.User.findOneAndUpdate(
                    {'local.username': socket.request.user},
                    {'local.online': false}).exec()
                    .then(() => {
                        debug(`${socket.request.user} (${socket.id}) is now offline`);

                        socket.broadcast.emit(events.offline, socket.request.user);
                    });
            } else {
                debug(`${socket.request.user} (${socket.id}) one of clients has disconnected`);
            }
        }

        function joinSavedChannels(nick, socket) {
            models.User.findOne(
                {'local.username': socket.request.user},
                {'local.channels': 1}).exec()
                .then((user) => {
                    user.local.channels.map((channel) => {
                        socket.join(channel);
                        // socket.emit(events.join, channel);
                    });
                });
        }
    });
};
