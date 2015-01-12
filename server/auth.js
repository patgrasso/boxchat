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

/*jslint node: true, regexp: true*/

// Initialize modules
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var fs = require('fs');
var database = require('./database');
var appRouting;

// Set up mailer
var nodemailer = require('nodemailer');
var emailInfo = 'email_information.json', transporter;
var serverInfo = 'server_information.json';

fs.readFile(emailInfo, function (err, data) {
    'use strict';
    if (err) {
        throw err;
    }
    transporter = nodemailer.createTransport(JSON.parse(data));
});

fs.readFile(serverInfo, function (err, data) {
    'use strict';
    if (err) {
        throw err;
    }
    serverInfo = JSON.parse(data);
});


// Encryption
var bcrypt = require('bcrypt');

// Connect-Mongo (session storage)
var sessionStore = new MongoStore({mongoose_connection: database.mongoose.connection});


// Passport
passport.serializeUser(function (user, done) {
    'use strict';
    console.log(user.id);
    done(null, user.id);
});


passport.deserializeUser(function (id, done) {
    'use strict';
    database.users.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new LocalStrategy(function (username, password, done) {
    'use strict';
    process.nextTick(function () {
        // Query userInfo for username, then compare passwords
        database.UserDetails.findOne({
            username: username
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

        req.logIn(user, function (err) {
            console.log(err);
            if (err) {
                return next(err);
            }
            console.log(user.username + ' (' + user.displayName + ') has logged in');
            return res.redirect('/chat');
        });
    })(req, res, next);
}


function inviteUser(req, res) {
    'use strict';
    var username = req.body.username,
        key = Math.floor(Math.random() * Math.pow(10, 16)).toString(32) +
            Math.floor(Math.random() * Math.pow(10, 16)).toString(32),

        mailOptions = {
            from: 'BoxChat <patgra123@yahoo.com>',
            to: username,
            subject: 'Join ' + req.user.box + ' on BoxChat!',
            html: '<p>You have been invited by ' + req.user.displayName + ' to the ' +
                req.user.box + ' box on BoxChat! Click the link below to complete ' +
                'your registration:</p>' +
                '<br/>' +
                '<a href="http://' + serverInfo.ip + '/invite?key=' + key + '">' +
                serverInfo.ip + '/invite?key=' + key + '</a>'
        };

    // Error-check email with regex
    if (username.toUpperCase().match(/^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/) === null) {
        res.status(400).send('Please enter a valid email address');
        console.log(username);
        return;
    }

    if (req.isAuthenticated() && req.user.permissions.admin === true) {

        // Check to see if the user is already registered
        database.users.find(username, function (userIfFound) {
            if (userIfFound !== null) {
                return res.status(400).send('user already exists');
            }

            // Check to see if the user has already been invited
            database.boxes.getInvites(req.user.box, function (invites) {
                invites.forEach(function (item) {
                    if (item.username === username) {
                        return res.status(400).send('invite already sent');
                    }
                });

                database.boxes.addInvite({
                    username: username,
                    key: key,
                    box: req.user.box
                });

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });

                console.log(key);
            });
        });
    } else {
        res.status(400).send('you do not have administrative rights');
    }
}


function identifyInvitation(key, callback) {
    'use strict';
    var found = false;

    database.boxes.getAll(function (err, boxes) {
        boxes.forEach(function (item) {
            item.invites.forEach(function (invite) {
                if (invite.key === key || invite.username === key) {
                    callback(invite);
                    found = true;
                }
            });
        });
        if (!found) {
            callback(null);
        }
    });
}


function finishRegistration(req, res) {
    'use strict';
    var username    = req.body.username,
        password    = req.body.password,
        displayName = req.body.displayName,
        salt        = bcrypt.genSaltSync(10),
        hash        = bcrypt.hashSync(password, salt),

        newUser = {
            username: username,
            password: hash,
            displayName: displayName,
            salt: salt,
            permissions: {
                admin: false,
                chat: true
            }
        };

    // Error-check email with regex
    if (username.toUpperCase().match(/^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/) === null) {
        res.status(400).send('Please enter a valid email address');
        console.log(username);
        return;
    }

    identifyInvitation(req.param('key'), function (invite) {
        if (invite === null) {
            return res.status(404).send('Invalid invitation URL');
        }
        database.users.find(username, function (user) {
            if (user !== null) {
                return res.status(400).send('user already exists');
            }

            database.boxes.removeInvite(invite, invite.box);

            database.boxes.getByName(invite.box, function (box) {
                newUser.box = box.name;
                newUser.rooms = [box.defaultRoom];

                database.users.addUser(newUser);
                database.boxes.addUser(newUser);

                return res.redirect('/login');
            });
        });
    });
}


function update(username, options) {
    'use strict';
    // Allow a string or user object to be passed in
    if (typeof username !== 'string' && username.username !== undefined) {
        username = username.username;
    }

    database.users.modify(username, options, function (err) { return !err; });
}


function getAllRooms(boxQuery, callback) {
    'use strict';
    database.boxes.getAll(boxQuery, callback)
}


function getAllBoxes(callback) {
    'use strict';
    database.boxes.getAll(callback);
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

    appRouting = app;

    return module.exports;
}


// Export
module.exports = {
    passport: passport,
    mongoose: database.mongoose,
    store: sessionStore,
    bodyParser: bodyParser,
    cookieParser: cookieParser,
    login: login,
    update: update,
    getAllRooms: getAllRooms,
    getAllBoxes: getAllBoxes,
    init: init,

    inviteUser: inviteUser,
    identifyInvitation: identifyInvitation,
    finishRegistration: finishRegistration
};
