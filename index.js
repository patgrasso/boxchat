var app = require('express')();
var http = require('http').Server(app);
var auth = require('./auth')(app);
var passport = auth.passport;
var socketChat = require('./socket-chat')(http, auth);

var clientFiles = [
		'/client-js/chat-client.js',
		'/client-js/require.js',
		'/client-js/binder.js'
	];


// Allow GET for files in clientFiles
app.use(clientFiles, function (req, res) {
	res.sendFile(__dirname + req.baseUrl);
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
