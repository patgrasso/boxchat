require(['binder'], function (binder) {
	var socket = io();
	var users = [];
	
	// Bind users[] to #online_users (<ul>) so that any changes to users[] will
	// reflect on the page immediately
	binder.attach(users, 'online_users', function (user) {
		return user.displayName; // Return the user's name to be displayed in the <li>
	});
	
	// Attach method to remove active users
	users.removeUser = function (user) {
		var i = 0;

		while (i < users.length && users[i].displayName !== user.displayName) {
			i += 1;
		}

		users.splice(i, 1);
	};

	$('form').submit(function () {
		socket.emit('chat_message', $('#m').val());
		$('#m').val('');
		return false;
	});

	// Adds a message to the <ul> we have goin
	function addMessage(msg, color, custom) {
		if (custom === true) {
			$('#messages').append($('<li>').text(msg).css('color', color));
		} else {
			$('#messages').append($('<li>').text(msg.from + ' : ' + msg.content).css('color', color));
		}
	}

	function updateOnlineUsers() {
		$('#online_users').empty();
		Object.keys(users).map(function (uid) {
			$('#online_users').append($('<li>').text(users[uid].displayName).css('color', '#449d44'));
		});
	}


	// ~~ PACKET HANDLERS ~~ //

	// This handler catches the client up with stored messages from the server
	socket.on('ketchup', function (messages) {
		messages.forEach(addMessage);
	});


	// userArr contains user objects for every active in the room
	socket.on('who', function (userArr) {
		userArr.forEach(function (user) {
			users.push(user);
		});
	});

	
	// Receives a chat message object with 'displayName', 'content', and 'datetime'
	socket.on('chat_message', function (msg) {
		addMessage(msg);
	});


	// Contains status information on a user in property 'stat'. See the protocol
	// document for more information on what this might contain
	socket.on('user_status', function (obj) {
		if (obj.stat === 'online') {
			users.push(obj);
		} else {
			users.removeUser(obj);
		}
	});
});
