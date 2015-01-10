/**
 *  Name: index.js
 *  Author: Patrick Grasso
 *  Description: This is the primary module run on server startup
 *      (e.g. $ node index.js). It contains routing information for different
 *      urls and request methods. This file should be kept primarily to routing
 *      and should not be cluttered with other functionalities that should be
 *      placed in other modules.
 *  Dependencies:
 *      app - See package.json
 *      http - See package.json
 *      auth - Authorization module which contains methods and information for
 *          accessing the Mongo DataBase, authorizing users, and managing sessions
 *      socketChat - socket.io handler module with websocket functionalities for
 *          the actual chat application
 */


var app = require('express')();
var http = require('http').Server(app);
var auth = require('./server/auth').init(app);
var passport = auth.passport;
var socketChat = require('./server/socket-chat')(http, auth, app);

var clientScripts = [
        '/client/chat-client.js',
        '/client/require.js',
        '/client/binder.js',
        '/client/messagelist.js',
        '/client/notifications.js',
        '/client/rooms.js',
        '/client/users.js',
        '/client/socket-wrapper.js',
        '/client/knockout-3.2.0.js',
        '/client/typinghint.js'
    ];

var clientCSS = [
        '/css/indexstyle.css'
    ];


// Allow GET for files in clientScripts and clientCSS
app.use(clientScripts, function (req, res) {
    'use strict';
    res.sendFile(__dirname + req.baseUrl);
});

app.use(clientCSS, function (req, res) {
    'use strict';
    res.sendFile(__dirname + '/views' + req.baseUrl);
});


// ~~ ROUTING ~~ //

app.get('/', function (req, res) {
    'use strict';
    if (req.isAuthenticated()) {
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});


app.get('/login', function (req, res) {
    'use strict';
    console.log("/login: " + req.ip);
    if (req.isAuthenticated()) {
        res.redirect('/chat');
    } else {
        res.sendFile(__dirname + '/views/login.html');
    }
});


app.post('/login', function (req, res, next) {
    'use strict';
    if (req.isAuthenticated()) {
        res.redirect('/chat');
    } else {
        auth.login(req, res, next);
    }
});


app.get('/register', function (req, res) {
    'use strict';
    res.sendFile(__dirname + '/views/register.html');
});


app.post('/register', function (req, res, next) {
    'use strict';
    auth.register(req, res, next);
});



// Chat room urls!
app.get(['/chat$', '/chat/*'], function (req, res) {
    'use strict';
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + '/views/index.html');
    } else {
        res.redirect('/login');
    }
});

app.get('/chat/', function (req, res) {
    'use strict';
    res.redirect('/chat');
});



// User information (background requests)
app.get('/userInfo/box', function (req, res) {
    'use strict';
    if (req.isAuthenticated()) {
        res.send(req.user.box);
    } else {
        res.status(401);
        res.send();
    }
});



app.get('/logout', function (req, res) {
    'use strict';
    if (req.isAuthenticated()) {
        req.logout();
    }
    res.redirect('/login');
});



// Serve 'em up
http.listen(3000, function () {
    'use strict';
    console.log('listening on *:3000');
});
