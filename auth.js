var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose/');
var session = require('express-session');


// MongoDB
mongoose.connect('mongodb://localhost/MyDatabase');

var Schema = mongoose.Schema;
var UserDetail = new Schema({
		username: String,
		password: String
	}, {
		collection: 'userInfo'
	});
var UserDetails = mongoose.model('userInfo', UserDetail);


// Passport
passport.serializeUser(function (user, done) {
	done(null, user);
});


passport.deserializeUser(function (user, done) {
	done(null, user);
});


passport.use(new LocalStrategy(function (username, password, done) {
	process.nextTick(function () {
		// Auth Check Logic
		UserDetails.findOne({
			'username': username
		}, function (err, user) {
			if (err) {
				return done(err);
			}

			if (!user) {
				return done(null, false);
			}

			if (user.password != password) {
				return done(null, false);
			}

			return done(null, user);
		});
	});
}));


// Authentication
function login(req, res, next) {
	passport.authenticate('local', function (err, user, info) {
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
			if (err) {
				return next(err);
			}
			return res.redirect('/chat');
		});
	})(req, res, next);
}


// Export
module.exports = function (app) {
	// Use session
	app.use(session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: true
	}));

	// Passport stuff
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.urlencoded({ extended: false }));

	return {
		passport: passport,
		mongoose: mongoose,
		bodyParser: bodyParser,
		login: login
	};
};
