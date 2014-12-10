module.exports = function (http) {
	var io = require('socket.io')(http);

	io.on('connection', function (socket) {
		console.log('a user connected');

		socket.on('

		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
	});
}
