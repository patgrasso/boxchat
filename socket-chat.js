module.exports = function (http, auth) {

	// Initialize modules
	var io = require('socket.io')(http);
	var passportSocketIO = require('passport.socketio');


	// Use passport.socketio to store user data in socket.request.user
	io.use(passportSocketIO.authorize({
		cookieParser: 	auth.cookieParser,
		secret: 		'keyboard cat',
		store: 			auth.store,
		passport:		auth.passport,
	}));

	
	// Connection handler
	io.on('connection', function (socket) {
		console.log(socket.request.user.displayName + ' has connected');

		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
	});


	return io;
}
