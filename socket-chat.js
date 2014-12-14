module.exports = function (http, auth) {

	// Initialize modules
	var io = require('socket.io')(http);
	var passportSocketIO = require('passport.socketio');
	var archive = require('./message-archive')('message_archive.dat');
	var users = [];

	// Attach a method to remove a user
	users.removeUser = function (user) {
		var i, newArr = this.filter(function (el) {
			return el.username !== user.username;
		});
		this.length = 0;
		for (i = 0; i < newArr.length; i += 1) {
			this.push(newArr[i]);
		}
	};

	
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

		// Add the user to users[] to have global access to all users
		users.push(user);

		console.log(user.displayName + ' has connected');
		socket.broadcast.emit('user_status', {
			user: user.displayName,
			connected: user.connected,
			stat: user.stat,
			verbose: true
		});

        // Catch the user up
		socket.emit('ketchup', messages);
		socket.emit('who', users.map(function (el) {
			return {
				displayName: el.displayName,
				stat: el.stat
			};
		}));

		// Chat Message
		socket.on('chat_message', function (msg) {
			lastMessage = {
				from: user.displayName,
				message: msg,
				datetime: new Date().toGMTString()
			};
				
			console.log(lastMessage);
            messages.push(lastMessage);
			appendToArchive(formatMessageToArchive(lastMessage));
			io.emit('chat_message', lastMessage);
		});
		
		// Disconnect
		socket.on('disconnect', function () {
			// Get rid of the user in the global array
			users.removeUser(user);
			console.log(users);
			console.log(user.displayName + ' has disconnected');
			io.emit('user_status', {
				user: user.displayName,
				connected: false,
				stat: USER_STATUS.offline,
				verbose: true
			});
		});
	});


	return io;
};
