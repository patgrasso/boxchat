var app = require('express')();
var http = require('http').Server(app);
var auth = require('./auth')(app);
var passport = auth.passport;


// Routing
app.get('/', function (req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	}
	res.redirect('/login');
});


app.get('/login', function (req, res) {
	res.sendFile(__dirname + '/views/login.html');
});


app.post('/login', function (req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	}
	auth.login(req, res, next);
});


app.get('/loginFailure', function (req, res, next) {
	res.send('Authentication Failed');
});


app.get('/loginSuccess', function (req, res, next) {
	res.redirect(__dirname + '/views/chat.html');
});


app.get('/chat', function (req, res, next) {
	if (req.isAuthenticated()) {
		console.log(req.user._id);
		res.send(req.user);
	}
	res.redirect('/login');
});


app.get('/logout', function (req, res, next) {
	if (req.isAuthenticated()) {
		req.logout();
		res.redirect('/login');
	}
	res.send('You are not logged in, and hence do not need to be logged out.');
});



// Serve 'em up
http.listen(3000, function () {
	console.log('listening on *:3000');
});
