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
mongoose.connect('mongodb://localhost/MyDatabase');

var Schema = mongoose.Schema;
var UserDetail = new Schema({
		username: String,
		password: String,
		salt: String,
		displayName: String
	}, {
		collection: 'userInfo'
	});
var UserDetails = mongoose.model('userInfo', UserDetail);


// Connect-Mongo (session storage)
var sessionStore = new MongoStore( {mongoose_connection: mongoose.connection} );


// Passport
passport.serializeUser(function (user, done) {
    console.log(user.id);
	done(null, user.id);
});


passport.deserializeUser(function (id, done) {
	UserDetails.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new LocalStrategy(function (username, password, done) {
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

        console.log(user);

		req.logIn(user, function (err) {
			if (err) {
				return next(err);
			}
			return res.redirect('/chat');
		});
	})(req, res, next);
}


function register(req, res, next) {
    var username	= req.body.username,
		password	= req.body.password,
		displayName = req.body.displayName,
		salt		= bcrypt.genSaltSync(10),
		hash		= bcrypt.hashSync(password, salt);

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
			salt: salt
		}, function (err, user) {
			console.log(err);
			console.log(user);
			res.redirect('/login');
		});
	});
}


// Export
module.exports = function (app) {

	// Set up session usage
	app.use(cookieParser());
	app.use(session({
		secret: 'keyboard cat',
        store: sessionStore,
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
        store: sessionStore,
		bodyParser: bodyParser,
        cookieParser: cookieParser,
		login: login,
		register: register
	};
};
