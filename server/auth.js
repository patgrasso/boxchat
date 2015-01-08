/**
 *  Name: auth.js
 *  Author: Patrick Grasso
 *  Description: This is the authorization module for boxchat. It can access
 *      the MongoDB storage for boxchat (which contains user information),
 *      authorize users, maintain user sessions, and utilize bcrypt to store
 *      sensitive information (passwords)
 *  Dependencies:
 *      bodyParser: See package.json
 *      passport: See package.json
 *      LocalStrategy: See package.json
 *      mongoose: See package.json
 *      session: See package.json
 *      cookieParser: See package.json
 *      MongoStore: See package.json
 *      bcrypt: See package.json
 */

/*jslint node: true*/

// Initialize modules
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose/');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);

// Encryption
var bcrypt = require('bcrypt');


// MongoDB
mongoose.connect('mongodb://localhost/BoxChatDB');

// User Information
var Schema = mongoose.Schema;
var UserDetail = new Schema({
        username: String,
        password: String,
        salt: String,
        displayName: String,
        permissions: {
            admin: Boolean,
            chat: Boolean
        },
        rooms: Array,
        box: String
    }, {
        collection: 'userInfo'
    });
var UserDetails = mongoose.model('userInfo', UserDetail);

// Room Information
var RoomDetail = new Schema({
        name: String
    }, {
        collection: 'roomInfo'
    });
var RoomDetails = mongoose.model('roomInfo', RoomDetail);

// Box Information
var BoxDetail = new Schema({
        name: String,
        plugins: Object,
        users: Array,
        rooms: Array
    }, {
        collection: 'boxInfo'
    });
var BoxDetails = mongoose.model('boxInfo', BoxDetail);

// Connect-Mongo (session storage)
var sessionStore = new MongoStore({mongoose_connection: mongoose.connection});


// Passport
passport.serializeUser(function (user, done) {
    'use strict';
    console.log(user.id);
    done(null, user.id);
});


passport.deserializeUser(function (id, done) {
    'use strict';
    UserDetails.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new LocalStrategy(function (username, password, done) {
    'use strict';
    process.nextTick(function () {
        // Query userInfo for username, then compare passwords
        UserDetails.findOne({
            'username': username
        }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false);
            }

            return done(null, user);
        });
    });
}));


// Authentication
function login(req, res, next) {
    'use strict';
    passport.authenticate('local', function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            if (req.body.async === 'true') {
                return res.send('Authentication Failed');
            }
            return res.redirect('/login');
        }

        console.log(user);

        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/chat');
        });
    })(req, res, next);
}


function register(req, res) {
    'use strict';
    var username    = req.body.username,
        password    = req.body.password,
        displayName = req.body.displayName,
        salt        = bcrypt.genSaltSync(10),
        hash        = bcrypt.hashSync(password, salt);

    // Check to see if user exists
    UserDetails.findOne({
        'username': username
    }, function (err, user) {
        if (user) {
            return res.send('<a href="/register">Username already taken</a>');
        }

        // If no user is found (disregard errors), create the user
        UserDetails.create({
            username: username,
            password: hash,
            displayName: displayName,
            salt: salt,
            permissons: {
                admin: false,
                chat: true
            }
        }, function (err, user) {
            console.log(err);
            console.log(user);
            res.redirect('/login');
        });
    });
}


function update(username, options) {
    'use strict';
    // Allow a string or user object to be passed in
    if (typeof username !== 'string' && username.username !== undefined) {
        username = username.username;
    }

    UserDetails.update({
        'username': username
    }, {
        '$set': options
    }, function (err) {
        return !err;
    });
}


function getAllRooms(boxQuery, callback) {
    'use strict';
    BoxDetails.findOne(boxQuery, function (err, data) {
        if (data) {
            callback(err, data.rooms);
        } else {
            callback(false);
        }
    });
}


function getAllBoxes(callback) {
    'use strict';
    BoxDetails.find(callback);
}


function init(app) {
    'use strict';
    // Set up session usage
    app.use(cookieParser());
    app.use(session({
        secret: 'cat keyboard',
        store: sessionStore,
        resave: false,
        saveUninitialized: true
    }));

    // Passport stuff
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(bodyParser.urlencoded({ extended: false }));

    return module.exports;
}


// Export
module.exports = {
    passport: passport,
    mongoose: mongoose,
    store: sessionStore,
    bodyParser: bodyParser,
    cookieParser: cookieParser,
    login: login,
    register: register,
    update: update,
    getAllRooms: getAllRooms,
    getAllBoxes: getAllBoxes
};
