module.exports = function (http, auth) {
	var io = require('socket.io')(http);

	io.on('connection', function (socket) {
		console.log('a user connected');
		console.log(socket.request.user);
		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
	});
}
