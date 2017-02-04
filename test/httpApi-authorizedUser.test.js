const app = require('../app');
const server = app.http;
const mockgoose = app.mockgoose;
const chai = require('chai'),
    expect = chai.expect,
    should = chai.should();
const request = require('supertest');
const io = require('socket.io-client');

const events = require('../events');

const models = require('../models');

const serverPort = 3001;
const serverUrl = `http://localhost:${serverPort}`;

const apiUrls = {
    register: '/api/register',
    signIn: '/api/authenticate',
    signOut: '/api/logout',
    users: '/api/users',
    userChannels: '/api/user/channels',
    channelMessages: '/api/channel/somechannel/messages',
};

const defaultUser = user = {
    username: 'mikko',
    password: 'mikko',
};

describe('authorized user', () => {
    before((done) => {
        server.listen(serverPort, () => {
            done();
        });
    });

    afterEach((done) => {
        mockgoose.reset(() => {
            done();
        });
    });

    it('should be able to sign out', (done) => {
        request(serverUrl)
            .post(apiUrls.register)
            .send(defaultUser)
            .expect('set-cookie', /express.sid/)
            .end((err, res) => {
                const cookie = res.headers['set-cookie'];

                request(serverUrl)
                    .post(apiUrls.signOut)
                    .send(defaultUser)
                    .set('Cookie', cookie)
                    .end((err, res) => {
                        expect(res.status).to.equal(200);

                        done();
                    });
            });
    });

    it('should be able to get the list of users', (done) => {
        request(serverUrl)
            .post(apiUrls.register)
            .send(defaultUser)
            .expect('set-cookie', /express.sid/)
            .end((err, res) => {
                const cookie = res.headers['set-cookie'];

                request(serverUrl)
                    .get(apiUrls.users)
                    .send(defaultUser)
                    .set('Cookie', cookie)
                    .end((err, res) => {
                        expect(res.status).to.equal(200);

                        expect(res.body).length.to.be(1);

                        expect(res.body[0].local).to.have.property('username');
                        expect(res.body[0].local).to.have.property('online');

                        done();
                    });
            });
    });

    it('should be able to get the list of users channels', (done) => {
        request(serverUrl)
            .post(apiUrls.register)
            .send(defaultUser)
            .expect('set-cookie', /express.sid/)
            .end((err, res) => {
                const newChannel = new models.Channel();

                newChannel.name = 'somechannel';

                newChannel.save()
                    .then(() => models.User.findOneAndUpdate(
                        {'local.username': defaultUser.username},
                        {$push: {'local.channels': 'somechannel'}}).exec())
                    .then(() => {
                        const cookie = res.headers['set-cookie'];

                        request(serverUrl)
                            .get(apiUrls.userChannels)
                            .send(defaultUser)
                            .set('Cookie', cookie)
                            .end((err, res) => {
                                expect(res.status).to.equal(200);

                                expect(res.body.local.channels.length).to.equal(1);

                                expect(res.body.local.channels).to.include('somechannel');

                                done();
                            });
                    });
            });
    });

    it('should not be able to get the list of messages from channel that user isn\'t joined', (done) => {
        request(serverUrl)
            .post(apiUrls.register)
            .send(defaultUser)
            .expect('set-cookie', /express.sid/)
            .end((err, res) => {
                const cookie = res.headers['set-cookie'];

                request(serverUrl)
                    .get(apiUrls.channelMessages)
                    .send(defaultUser)
                    .set('Cookie', cookie)
                    .end((err, res) => {
                        expect(res.status).to.equal(401);

                        expect(res.body).to.have.property('error', 'Not joined to channel.');

                        done();
                    });
            });
    });

    it('should be able to get the list of messages from channel that user is joined', (done) => {
        request(serverUrl)
            .post(apiUrls.register)
            .send(defaultUser)
            .expect('set-cookie', /express.sid/)
            .end((err, res) => {
                const newChannel = new models.Channel();

                newChannel.name = 'somechannel';

                newChannel.save()
                    .then(() => models.User.findOneAndUpdate(
                        {'local.username': defaultUser.username},
                        {$push: {'local.channels': 'somechannel'}}).exec())
                    .then(() => {
                        const cookie = res.headers['set-cookie'];

                        request(serverUrl)
                            .get(apiUrls.channelMessages)
                            .send(defaultUser)
                            .set('Cookie', cookie)
                            .end((err, res) => {
                                expect(res.status).to.equal(200);
                                done();
                            });
                    });
            });
    });
});
