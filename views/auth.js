var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose/');


// Export
module.exports = function (app) {
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.urlencoded({ extended: false }));

	return {
		passport: passport,
		mongoose: mongoose,
		bodyParser: bodyParser
	};
};


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
	console.log(user);
	done(null, user);
});


passport.deserializeUser(function (user, done) {
	done(null, user);
});


passport.use(new LocalStrategy(function (username, password, done) {
	process.nextTick(function () {
		console.log('hey');
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

			console.log(user);
			return done(null, user);
		});
	});
}));
