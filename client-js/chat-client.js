(function () {
	var socket = io();

	$('form').submit(function () {
		socket.emit('chat_message', $('#m').val());
		$('#m').val('');
		return false;
	});

	// Adds a message to the <ul> we have goin
	function addMessage(msg) {
		$('#messages').append($('<li>').text(msg.from + ' : ' + msg.message));
	}


	// Packet handlers
	socket.on('ketchup', function (messages) {
		messages.forEach(addMessage);
	});

	socket.on('chat_message', function (msg) {
		addMessage(msg);
	});

	socket.on('status', function (obj) {
		console.log(obj);
	});
})();
