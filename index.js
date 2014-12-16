/**
 *	Name: index.js
 *	Author: Patrick Grasso
 *	Description: This is the primary module run on server startup
 *		(e.g. $ node index.js). It contains routing information for different
 *		urls and request methods. This file should be kept primarily to routing
 *		and should not be cluttered with other functionalities that should be
 *		placed in other modules.
 *	Dependencies:
 *		app - See package.json
 *		http - See package.json
 *		auth - Authorization module which contains methods and information for
 *			accessing the Mongo DataBase, authorizing users, and managing sessions
 *		socketChat - socket.io handler module with websocket functionalities for
 * 			the actual chat application
 */


var app = require('express')();
var http = require('http').Server(app);
var auth = require('./server/auth')(app);
var passport = auth.passport;
var socketChat = require('./server/socket-chat')(http, auth);

var clientScripts = [
		'/client/chat-client.js',
		'/client/require.js',
		'/client/binder.js',
		'/client/messagelist.js'
	];

var clientCSS = [
		'/css/indexstyle.css'
	];


// Allow GET for files in clientScripts and clientCSS
app.use(clientScripts, function (req, res) {
	res.sendFile(__dirname + req.baseUrl);
});

app.use(clientCSS, function (req, res) {
	res.sendFile(__dirname + '/views' + req.baseUrl);
});


// ~~ ROUTING ~~ //

app.get('/', function (req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	} else {
		res.redirect('/login');
	}
});


app.get('/login', function (req, res) {
    console.log("/login: " + req.ip);
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	} else {
		res.sendFile(__dirname + '/views/login.html');
	}
});


app.post('/login', function (req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	} else {
		auth.login(req, res, next);
	}
});


app.get('/register', function (req, res, next) {
    res.sendFile(__dirname + '/views/register.html');
});


app.post('/register', function (req, res, next) {
    auth.register(req, res, next);
});


app.get('/chat', function (req, res, next) {
	if (req.isAuthenticated()) {
		res.sendFile(__dirname + '/views/index.html');
	} else {
		res.redirect('/login');
	}
});


app.get('/logout', function (req, res, next) {
	if (req.isAuthenticated()) {
		req.logout();
	}
	res.redirect('/login');
});



// Serve 'em up
http.listen(3000, function () {
	console.log('listening on *:3000');
});
