module.exports = function (http, auth) {

	// Initialize modules
	var io = require('socket.io')(http);
	var passportSocketIO = require('passport.socketio');
	var archive = require('./message-archive')('message_archive.dat');
	var users = require('./users')(io);
	
	// Global protocol objects
	var CHAT_AUX_TYPE = {
		startTyping: 'start_typing',
		stopTyping: 'stop_typing'
	};

	var USER_STATUS = {
		online: 'online',
		offline: 'offline',
		away: 'away'
	};


	// Use passport.socketio to store user data in socket.request.user
	io.use(passportSocketIO.authorize({
		cookieParser: 	auth.cookieParser,
		secret: 		'cat keyboard',
		store: 			auth.store,
		passport:		auth.passport,
	}));

	
	// Connection handler
	io.on('connection', function (socket) {
		var user = socket.request.user,
			lastMessage = {};

		// Set user's status to ONLINE
		user.stat = USER_STATUS.online;

		// Let everybody know that user has connected
		console.log(user.displayName + ' has connected');
		socket.broadcast.emit('user_status', users.toStatusUser(user, 'online'));

        // Catch the user up
		socket.emit('ketchup', archive.messages);
		socket.emit('who', users.getAll(['displayName', 'stat']));


		// Chat Message
		socket.on('chat_message', function (msg) {
			lastMessage = {
				from: user.displayName,
				content: msg,
				datetime: new Date().toGMTString()
			};

			console.log(lastMessage);
            archive.messages.push(lastMessage);
			archive.write(lastMessage);
			io.emit('chat_message', lastMessage);
		});


		// Disconnect
		socket.on('disconnect', function () {
			console.log(user.displayName + ' has disconnected');
			io.emit('user_status', users.toStatusUser(user, 'offline'));
		});
	});


	return io;
};
