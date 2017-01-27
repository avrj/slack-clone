const mongoose = require('mongoose');
const logger = require('morgan');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const passportSocketIo = require('passport.socketio');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const passportConfig = require('./config/passport')(passport);
const sessionStore = new RedisStore();
const compression = require('compression');
const path = require('path');

const User = require('./models/User');
const Channel = require('./models/Channel');
const Message = require('./models/Message');

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/chat_dev');

const cors = require('cors');

app.use(cors());

app.use(logger('dev'));
app.use(compression());

app.use(session({
  key: 'express.sid',
  store: sessionStore,
  secret: 'keyboard cat',
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.local.username);
});

passport.deserializeUser((username, done) => {
  done(null, username);
});


// in your passport.socketio setup
// With Socket.io >= 1.0 (you will have the same setup for Socket.io <1)
io.use(passportSocketIo.authorize({
  cookieParser: require('cookie-parser'), // optional your cookie-parser middleware function. Defaults to require('cookie-parser')
  key: 'express.sid',       // make sure is the same as in your session settings in app.js
  secret: 'keyboard cat',      // make sure is the same as in your session settings in app.js
  store: sessionStore,        // you need to use the same sessionStore you defined in the app.use(session({... in app.js
  success: (data, accept) => {
    accept();
  }, // *optional* callback on success
  fail: (data, message, error, accept) => {
    // error indicates whether the fail is due to an error or just a unauthorized client
    if (error) {
      console.log(`error: ${message}`);
      accept(new Error('Unauthorized'));
    } else {
      console.log(`ok: ${message}`);

        // the same accept-method as above in the success-callback

      accept(new Error('Unauthorized'));
    }
  },     // *optional* callback on fail/error
}));

const socketHandler = require('./socket.js')(io);


const channels = ['general', 'frontend', 'backend', 'ci'];
const users = {};


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));


app.post('/register', passport.authenticate('local-signup'), (req, res) => {
  res.json(req.user);
});

app.post('/authenticate', passport.authenticate('local-login'), (req, res) => {
  res.json(req.user);
});

app.post('/logout', (req, res) => {
  console.log(req.user);
  if (!req.user) return res.status(500).json({ error: true });

  req.logout();
  res.json({ success: true });
});


app.use('/js', express.static(`${__dirname}/public/js`, { maxAge: 86400000 }));


app.get('/dev', (req, res) => {
  User.find({}, { 'local.username': 1, 'local.online': 1, 'local.channels': 1, _id: 0 }, (err, data) => {
    if (err) {
      return res.status(500).json({ error: true });
    }

    res.json(data);
  });
});

app.get('/users', (req, res) => {
  if (!req.user) return res.status(401).end();

  User.find({}, { 'local.username': 1, 'local.online': 1, _id: 0 }, (err, data) => {
    if (err) {
      return res.status(500).json({ error: true });
    }

    res.json(data);
  });
});


app.get('/channels', (req, res) => {
  if (!req.user) return res.status(401).end();

  Channel.find({}, { name: 1, _id: 0 }, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ msg: 'internal server error' });
    }
    res.json(data);
  });
});

app.get('/channel/:name/messages', (req, res) => {
  if (!req.user) return res.status(401).end();

  Message.find({ channel: req.params.name }, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: true });
    }
    res.json(data);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});

if (process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('./webpack.config.js');

new WebpackDevServer(webpack(webpackConfig), {
    historyApiFallback: true,
    hot: true,
    publicPath: webpackConfig.output.publicPath,
    proxy: { '*': 'http://0.0.0.0:3000' },
}).listen(8080, 'localhost', err => {
    if (err) console.log(err);
    console.log('Webpack Dev Server listening at 8080');
});
}