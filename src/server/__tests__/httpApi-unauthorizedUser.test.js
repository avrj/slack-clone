const app = require('../app')

const server = app.app
const mockgoose = app.mockgoose
const chai = require('chai'),
  expect = chai.expect,
  should = chai.should()
const request = require('supertest')
const io = require('socket.io-client')

const events = require('../../common/events')

const apiUrls = {
  register: '/api/register',
  authenticate: '/api/authenticate',
  logout: '/api/logout',
  users: '/api/users',
  userChannels: '/api/user/channels',
  channelMessages: '/api/channel/somechannel/messages',
  usernameExists: '/api/username/mikko',
}

const defaultUser = (user = {
  username: 'mikko',
  password: 'mikko',
})

describe('unauthorized user', () => {
  afterEach(done => {
    mockgoose.reset(() => {
      done()
    })
  })

  it('should be able to sign up with username and password', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .expect('set-cookie', /express.sid/)
      .end((err, res) => {
        expect(res.status).to.equal(200)
        done()
      })
  })

  it('should not be able to sign up with username that is already in use', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .expect(200)
      .end((err, res) => {
        request(server)
          .post(apiUrls.register)
          .send(defaultUser)
          .end((err, res) => {
            expect(res.status).to.equal(401)
            done()
          })
      })
  })

  it('should be able to sign in with username and password after signing up', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .expect('set-cookie', /express.sid/)
      .end((err, res) => {
        request(server)
          .post(apiUrls.authenticate)
          .send(defaultUser)
          .end((err, res) => {
            expect(res.status).to.equal(200)
            done()
          })
      })
  })

  it('should not be able to sign in with wrong username', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .expect('set-cookie', /express.sid/)
      .end((err, res) => {
        request(server)
          .post(apiUrls.authenticate)
          .send(Object.assign({}, defaultUser, { username: 'wrongusername' }))
          .end((err, res) => {
            expect(res.status).to.equal(401)
            done()
          })
      })
  })

  it('should not be able to sign in with wrong password', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .expect('set-cookie', /express.sid/)
      .end((err, res) => {
        request(server)
          .post(apiUrls.authenticate)
          .send(Object.assign({}, defaultUser, { password: 'wrongpassword' }))
          .end((err, res) => {
            expect(res.status).to.equal(401)
            done()
          })
      })
  })

  it('should not be able to log out', done => {
    request(server)
      .post(apiUrls.logout)
      .end((err, res) => {
        expect(res.status).to.equal(500)
        done()
      })
  })

  it('should not be able to get the list of users', done => {
    request(server)
      .get(apiUrls.users)
      .end((err, res) => {
        expect(res.status).to.equal(401)
        done()
      })
  })

  it('should not be able to get the list of channels', done => {
    request(server)
      .get(apiUrls.userChannels)
      .end((err, res) => {
        expect(res.status).to.equal(401)
        done()
      })
  })

  it('should not be able to get the list of messages on channel', done => {
    request(server)
      .get(apiUrls.channelMessages)
      .end((err, res) => {
        expect(res.status).to.equal(401)
        done()
      })
  })

  it('should be able to check if username exists', done => {
    request(server)
      .post(apiUrls.register)
      .send(defaultUser)
      .end((err, res) => {
        request(server)
          .get(apiUrls.usernameExists)
          .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('alreadyInUse', true)

            done()
          })
      })
  })

  it("should be able to check if username doesn't exist", done => {
    request(server)
      .get(apiUrls.usernameExists)
      .end((err, res) => {
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('alreadyInUse', false)

        done()
      })
  })
})
