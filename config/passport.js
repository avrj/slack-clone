

const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  },
        (req, username, password, done) => {
          User.findOne({ 'local.username': username }, (err, user) => {
            if (err) {
              return done(err);
            }
            if (user) {
              return done(null, false);
            }
            const newUser = new User();

            newUser.local.username = username;
            newUser.local.password = newUser.generateHash(password);
            newUser.save((err, user) => {
              if (err) {
                throw err;
              }
              return done(null, newUser);
            });
          });
        }));

  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  },
        (req, username, password, done) => {
          User.findOne({ 'local.username': username }, (err, user) => {
            if (err) {
              return done(err);
            }
            if (!user) {
              return done(null, false);
            }
            if (!user.validPassword(password)) {
              return done(null, false);
            }
            return done(null, user);
          });
        }));
};
