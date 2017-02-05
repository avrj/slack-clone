const mongoose = require('mongoose');
const logger = require('morgan');
const express = require('express');
const app = express();
const helmet = require('helmet');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const passportSocketIo = require('passport.socketio');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const compression = require('compression');
const path = require('path');
const mockgoose = require('mockgoose');

const config = require('./config/');
const passportConfig = require('./config/passport')(config, passport);
const routes = require('./routes');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV == 'test') {
    mockgoose(mongoose).then(() => {
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/chat_dev');
    });
} else {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/chat_dev');
}

app.use(helmet());

app.use(logger('dev'));
app.use(compression());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

const sessionStore = new MongoStore({mongooseConnection: mongoose.connection});

app.use(session({
    key: 'express.sid',
    store: sessionStore,
    secret: process.env.SESSION_SECRET || config.session.secret,
    cookie: {httpOnly: false}
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.local.username);
});

passport.deserializeUser((username, done) => {
    done(null, username);
});

app.use('/', routes);

if (process.env.NODE_ENV == 'development') {
    console.log('Webpack dev middleware enabled');

    const webpack = require('webpack');
    const webpackConfig = require('./webpack.config.dev.js')
    const compiler = webpack(webpackConfig);

    app.use(require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath
    }));

    app.use(require('webpack-hot-middleware')(compiler));
} else {
    console.log('Serving production bundle')

    app.get('/bundle.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'bundle.js'));
    });
    app.get('/bundle.js.map', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'bundle.js.map'));
    });
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.use(passportSocketIo.authorize({
    key: 'express.sid',
    secret: config.session.secret,
    store: sessionStore,
    success: (data, accept) => {
        accept();
    },
    fail: (data, message, error, accept) => {
        if (error) {
            console.log(`error: ${message}`);

            accept(new Error('Unauthorized'));
        } else {
            console.log(`ok: ${message}`);
            accept(new Error('Unauthorized'));
        }
    },
}));

const socketHandler = require('./socket.js')(config, io);

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    http.listen(port, () => {
        console.log(`listening on *:${port}`);
    });
}

module.exports = {
    http,
    mockgoose: process.env.NODE_ENV == 'test' ? mockgoose : null,
};
