var app = require('express')();
var http = require('http').Server(app);
var auth = require('./auth')(app);
var passport = auth.passport;


// Routing
app.get('/', function (req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/chat');
	} else {
		res.redirect('/login');
	}
});


app.get('/login', function (req, res) {
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


app.get('/chat', function (req, res, next) {
	if (req.isAuthenticated()) {
		res.send('Welcome, ' + req.user.displayName + '.<br />' + 
			'Please visit /logout to log out.');
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
