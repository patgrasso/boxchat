module.exports = function (http, auth) {

	// Initialize modules
	var io = require('socket.io')(http);
	var passportSocketIO = require('passport.socketio');
	var fs = require('fs');
    var messages = loadMessageData('message_archive.dat');
	var appendToArchive = 'message_archive.dat';

	// Use passport.socketio to store user data in socket.request.user
	io.use(passportSocketIO.authorize({
		cookieParser: 	auth.cookieParser,
		secret: 		'cat keyboard',
		store: 			auth.store,
		passport:		auth.passport,
	}));


	// ~~ ARCHIVE HANDLING ~~ //

	// Load messages from the archive file
	function loadMessageData(filename) {
		var buf, lines, msgArr = [];

		try {
			buf = fs.readFileSync(filename);
			lines = buf.toString().split('\n');
			lines.forEach(function (line) {
				if (line !== '') {
					msgArr.push(createMessageFromArchive(line));
				}
			});
		} catch (exception) {
			console.log(exception);
		}
		
		return msgArr;
	}


	// Create a JSON array with the data from a message that can be stored
	// in the archive file
	function formatMessageToArchive(msg) {
		return '["' + msg.from + '","' + msg.message + '","' + msg.datetime + '"]';
	}


	// Creates an object from an an entry in the message archive
	function createMessageFromArchive(line) {
		var dataArr = JSON.parse(line);
		return {
			from: dataArr[0],
			message: dataArr[1],
			datetime: dataArr[2]
		};
	}

	
	// Create a stream for appending new message data to the archive
	appendToArchive = (function (filename) {
		var appendStream, ok = true;

		try {
			appendStream = fs.createWriteStream(filename, { flags: 'a' });
		} catch (exception) {
			console.log(exception);
		}

		function write(data) {
			ok = appendStream.write(data + '\n');
			if (!ok) {
				appendStream.once('drain', write);
			}
		}

		return write;
	})(appendToArchive);

	
	// Connection handler
	io.on('connection', function (socket) {
		var user = socket.request.user,
			lastMessage = {};

		console.log(user.displayName + ' has connected');

        // Catch the user up
		socket.emit('ketchup', messages);

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
			console.log(user.displayName + ' has disconnected');
			io.emit('status', {
				test1: 'soup',
				test2: 42,
				test3: function (a) {
					return a*3;
				}
			});
		});
	});


	return io;
};
