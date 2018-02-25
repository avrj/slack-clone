const app = require('../app')

const server = app.app
const mockgoose = app.mockgoose
const chai = require('chai'),
  expect = chai.expect,
  should = chai.should()
const request = require('supertest')
const io = require('socket.io-client')

const events = require('../../common/events')

function getSessionIdFromCookie (res) {
  let cookie = res.headers['set-cookie']

  cookie = cookie[0]
  cookie = cookie.split('%3A')[1]
  cookie = cookie.split('.')[0]

  return cookie
}

const apiUrls = {
  register: '/api/register',
  authenticate: '/api/authenticate',
}

const defaultUser = (user = {
  username: 'mikko',
  password: 'mikko',
})

const serverPort = 3001

describe('chat server', () => {
  beforeEach(function (done) {
    server.listen(serverPort, () => {
      request(server)
        .post(apiUrls.register)
        .send(defaultUser)
        .expect(200)
        .end((err, res) => {
          this.cookie = getSessionIdFromCookie(res)

          this.client = io.connect(server, {
            query: `session_id=${this.cookie}`,
          })

          done()
        })
    })
  })

  afterEach(done => {
    mockgoose.reset(() => {
      done()
    })
  })

  it('should be able to connect with session id', function (done) {
    this.client.on(events.connect, data => {
      this.client.disconnect()
      done()
    })
  })

  it('should not be able to connect without session id', done => {
    this.client = io.connect(server)

    this.client.on(events.error, data => {
      expect(data).to.equal('Unauthorized')

      this.client.disconnect()
      done()
    })
  })

  it('should not be able to connect with invalid session id', done => {
    this.client = io.connect(server, {
      query: 'session_id=invalid',
    })

    this.client.on(events.error, data => {
      expect(data).to.equal('Unauthorized')

      this.client.disconnect()
      done()
    })
  })

  it('should emit online event to other users', function (done) {
    const newUser = {
      username: 'jenni',
      password: 'jenni',
    }

    this.client.on(events.connect, data => {
      request(server)
        .post(apiUrls.register)
        .send(newUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.disconnect()
          })
        })
    })

    this.client.on(events.online, user => {
      expect(user).to.equal(newUser.username)

      this.client.disconnect()
      done()
    })
  })

  it('should emit offline event to other users when disconnecting', function (done) {
    const newUser = {
      username: 'jenni',
      password: 'jenni',
    }

    this.client.on(events.connect, data => {
      request(server)
        .post(apiUrls.register)
        .send(newUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.disconnect()
          })
        })
    })

    this.client.on(events.offline, user => {
      expect(user).to.equal(newUser.username)

      this.client.disconnect()
      done()
    })
  })

  it('joining a channel that doesnt exist already should emit join event to that user', function (done) {
    const newChannel = 'channelthatdoesntexist'

    this.client.on(events.connect, data => {
      this.client.emit(events.join, newChannel)
    })

    this.client.on(events.join, channel => {
      expect(channel).to.equal(newChannel)

      this.client.disconnect()
      done()
    })
  })

  it('joining a channel that doesnt exist already should emit join event to all clients of that user', function (done) {
    const newChannel = 'channelthatdoesntexist'

    this.client.on(events.connect, data => {
      request(server)
        .post(apiUrls.authenticate)
        .send(defaultUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.emit(events.join, newChannel)
            anotherClient.disconnect()
          })
        })
    })

    this.client.on(events.join, channel => {
      expect(channel).to.equal(newChannel)

      this.client.disconnect()
      done()
    })
  })

  it('leaving a (joined) channel should emit leave event to that user', function (done) {
    const newChannel = 'channelthatdoesntexist'

    this.client.on(events.connect, data => {
      this.client.emit(events.join, newChannel)
    })

    this.client.on(events.join, channel => {
      this.client.emit(events.leave, channel)
    })

    this.client.on(events.leave, channel => {
      expect(channel).to.equal(newChannel)

      this.client.disconnect()
      done()
    })
  })

  it('sending a message to a (joined) channel should emit message event to all clients of that user', function (done) {
    const msgInput = {
      room: 'channel',
      msg: 'msg',
    }

    this.client.on(events.connect, data => {
      this.client.emit(events.join, msgInput.room)
    })

    this.client.on(events.join, channel => {
      request(server)
        .post(apiUrls.authenticate)
        .send(defaultUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.emit(events.msg, msgInput)
            anotherClient.disconnect()
          })
        })
    })

    this.client.on(events.msg, msg => {
      expect(msg.room).to.equal(msgInput.room)
      expect(msg.user).to.equal(defaultUser.username)
      expect(msg.msg).to.equal(msgInput.msg)
      expect(msg).to.have.property('date')

      this.client.disconnect()
      done()
    })
  })

  it('sending a message to a (joined) channel should emit message event to all users on that channel', function (done) {
    const msgInput = {
      room: 'channel',
      msg: 'msg',
    }

    const newUser = {
      username: 'jenni',
      password: 'jenni',
    }

    this.client.on(events.connect, data => {
      this.client.emit(events.join, msgInput.room)
    })

    this.client.on(events.join, channel => {
      request(server)
        .post(apiUrls.register)
        .send(newUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.emit(events.join, msgInput.room)
          })

          anotherClient.on(events.join, () => {
            anotherClient.emit(events.msg, msgInput)
          })
        })
    })

    this.client.on(events.msg, msg => {
      expect(msg.room).to.equal(msgInput.room)
      expect(msg.user).to.equal(newUser.username)
      expect(msg.msg).to.equal(msgInput.msg)
      expect(msg).to.have.property('date')

      this.client.disconnect()
      done()
    })
  })

  it('sending a private message to another user should emit private message event to all clients of that user', function (done) {
    const newUser = {
      username: 'jenni',
      password: 'jenni',
    }

    const msgInput = {
      to: defaultUser.username,
      msg: 'msg',
    }

    this.client.on(events.connect, data => {
      request(server)
        .post(apiUrls.register)
        .send(newUser)
        .expect(200)
        .end((err, res) => {
          const cookie = getSessionIdFromCookie(res)

          const anotherClient = io.connect(server, {
            query: `session_id=${cookie}`,
          })

          anotherClient.on(events.connect, () => {
            anotherClient.emit(events.privateMsg, msgInput)
            anotherClient.disconnect()
          })
        })
    })

    this.client.on(events.privateMsg, msg => {
      expect(msg.from).to.equal(newUser.username)
      expect(msg.msg).to.equal(msgInput.msg)

      this.client.disconnect()
      done()
    })
  })
})
