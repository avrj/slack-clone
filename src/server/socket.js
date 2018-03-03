const passportSocketIo = require('passport.socketio')
const debug = require('debug')('chat')

const events = require('../common/events')
const models = require('./models')

const joinSavedChannels = (nick, socket) => {
  models.User.findOne(
    { 'local.username': socket.request.user },
    { 'local.channels': 1 }
  )
    .exec()
    .then(user => user.local.channels.forEach(channel => socket.join(channel)))
}

const handleJoin = (socket, connectedClientsForUser) => channelToJoin => {
  if (!channelToJoin) {
    debug('error joining channel: no channel specified')
    return
  }

  // eslint-disable-next-line no-param-reassign
  channelToJoin = channelToJoin.toLowerCase()

  models.Channel.findOne({ name: channelToJoin }, (err, channel) => {
    if (channel) {
      models.User.findOne({
        'local.username': socket.request.user,
        'local.channels': channelToJoin,
      })
        .exec()
        .then(user => {
          if (user) {
            const errorMsg = `error joining channel: ${
              socket.request.user
            } is already joined to ${channelToJoin}`
            debug(errorMsg)
            throw new Error(errorMsg)
          } else {
            connectedClientsForUser.forEach(socketInstance => {
              socketInstance.join(channelToJoin)
              socketInstance.emit(events.join, channelToJoin)
            })

            return models.User.findOneAndUpdate(
              { 'local.username': socket.request.user },
              { $push: { 'local.channels': channelToJoin } }
            ).exec()
          }
        })
        .then(() => {
          debug(
            `${socket.request.user} (${
              socket.id
            }) joined channel ${channelToJoin}`
          )
        })
    } else {
      connectedClientsForUser.forEach(socketInstance => {
        socketInstance.join(channelToJoin)
        socketInstance.emit(events.join, channelToJoin)
      })

      const newChannel = new models.Channel()

      newChannel.name = channelToJoin

      newChannel
        .save()
        .then(() =>
          models.User.findOneAndUpdate(
            { 'local.username': socket.request.user },
            { $push: { 'local.channels': channelToJoin } }
          ).exec()
        )
        .then(() =>
          debug(
            `${socket.request.user} (${
              socket.id
            }) joined channel ${channelToJoin}`
          )
        )
    }
  })
}

const handleLeave = (socket, config, connectedClientsForUser) => channelIn => {
  if (!channelIn) {
    debug('error leaving channel: no channel specified')

    return
  }

  if (channelIn === config.defaultChannel) {
    debug("can't leave the default channel")

    return
  }

  const channel = channelIn.toLowerCase()

  models.User.findOne({
    'local.username': socket.request.user,
    'local.channels': channel,
  })
    .exec()
    .then(user => {
      if (user) {
        connectedClientsForUser.forEach(socketInstance => {
          socketInstance.leave(channel)
          socketInstance.emit(events.leave, channel)
        })

        return models.User.findOneAndUpdate(
          { 'local.username': socket.request.user },
          { $pull: { 'local.channels': channel } }
        )
      }
      throw new Error(`${socket.request.user} is not joined to ${channel}`)
    })
    .then(() => {
      debug(`${socket.request.user} (${socket.id}) leaved channel ${channel}`)
    })
    .then(null, error => debug(`error leaving channel: ${error}`))
}

const handleMsg = socket => data => {
  if (!data.room) {
    debug('error sending message: no channel selected')
    return
  }

  if (!socket.rooms[data.room]) {
    debug('error sending message: not joined to channel')
    return
  }

  if (!data.msg) {
    debug('error sending message: no message specified')
    return
  }

  // eslint-disable-next-line no-param-reassign
  data.room = data.room.toLowerCase()

  const msgData = {
    date: Date.now(),
    room: data.room,
    user: socket.request.user,
    msg: data.msg,
  }

  socket.broadcast.to(data.room).emit(events.msg, msgData)

  const newMessage = new models.Message()

  newMessage.user = socket.request.user
  newMessage.text = data.msg
  newMessage.channel = data.room

  newMessage
    .save()
    .then(() =>
      debug(
        `${socket.request.user} (${socket.id}) sent message ${
          data.msg
        } to channel ${data.room}`
      )
    )
    .then(null, error => debug(`error sending message: ${error}`))
}

const handlePrivateMsg = (socket, io, connectedClientsForUser) => data => {
  if (!data.to) {
    debug('error sending private message: no receiver specified')
    return
  }

  if (!data.msg) {
    debug('error sending private message: no message specified')
    return
  }

  // eslint-disable-next-line no-param-reassign
  data.to = data.to.toLowerCase()

  debug(
    `${socket.request.user} (${socket.id}) sent private message ${
      data.msg
    } to ${data.to}`
  )

  /* send private msg to all clients of receiver if receiver is not the sender */
  if (data.to !== socket.request.user) {
    passportSocketIo
      .filterSocketsByUser(io, user => user === data.to)
      .forEach(socketInstance => {
        socketInstance.emit(events.privateMsg, {
          from: socket.request.user,
          msg: data.msg,
        })
      })
  }

  /* send copy of privatemsg to all clients of sender */
  connectedClientsForUser.forEach(socketInstance => {
    if (socketInstance !== socket) {
      socketInstance.emit(events.ownPrivateMsg, {
        to: data.to,
        msg: data.msg,
      })
    }
  })
}

const handleDisconnect = (socket, connectedClientsForUser) => () => {
  if (connectedClientsForUser.length <= 1) {
    models.User.findOneAndUpdate(
      { 'local.username': socket.request.user },
      { 'local.online': false }
    )
      .exec()
      .then(() => {
        debug(`${socket.request.user} (${socket.id}) is now offline`)

        socket.broadcast.emit(events.offline, socket.request.user)
      })
  } else {
    debug(
      `${socket.request.user} (${socket.id}) one of clients has disconnected`
    )
  }
}

module.exports = (config, io) => {
  io.sockets.on('connection', socket => {
    // eslint-disable-next-line no-param-reassign
    socket.request.user = socket.request.user.toLowerCase()

    joinSavedChannels(socket.request.user, socket)

    const connectedClientsForUser = passportSocketIo.filterSocketsByUser(
      io,
      user => user === socket.request.user
    )

    if (connectedClientsForUser.length <= 1) {
      socket.broadcast.emit(events.online, socket.request.user)

      models.User.findOneAndUpdate(
        { 'local.username': socket.request.user },
        { 'local.online': true }
      )
        .exec()
        .then(() =>
          debug(`${socket.request.user} is now online with client ${socket.id}`)
        )
    } else {
      debug(
        `${socket.request.user} is now connected with new client ${socket.id}`
      )
    }

    socket.on(events.join, handleJoin(socket, connectedClientsForUser))
    socket.on(
      events.leave,
      handleLeave(socket, config, connectedClientsForUser)
    )
    socket.on(events.msg, handleMsg(socket))
    socket.on(
      events.privateMsg,
      handlePrivateMsg(socket, io, connectedClientsForUser)
    )
    socket.on(
      events.disconnect,
      handleDisconnect(socket, connectedClientsForUser)
    )
  })
}
