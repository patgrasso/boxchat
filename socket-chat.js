module.exports = function (http, auth) {

	// Initialize modules
	var io = require('socket.io')(http);
	var passportSocketIO = require('passport.socketio');
    var messages = [];


	// Use passport.socketio to store user data in socket.request.user
	io.use(passportSocketIO.authorize({
		cookieParser: 	auth.cookieParser,
		secret: 		'keyboard cat',
		store: 			auth.store,
		passport:		auth.passport,
	}));

	
	// Connection handler
	io.on('connection', function (socket) {
		var user = socket.request.user;
		console.log(user.displayName + ' has connected');

        // Catch the user up
        messages.forEach(function (msg) {
            socket.emit('chat_message', msg);
        });


		// Chat Message
		socket.on('chat_message', function (msg) {
			console.log(user.displayName + ' : ' + msg);
            messages.push(user.displayName + ' : ' + msg);
			io.emit('chat_message', user.displayName + ' : ' + msg);
		});
		

		// Disconnect
		socket.on('disconnect', function () {
			console.log(user.displayName + ' has disconnected');
		});
	});


	return io;
}
