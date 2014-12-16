require(['binder', 'messagelist'], function (binder, messageList) {
	var socket = io();
	var users = [];
	
	// Bind users[] to #online_users (<ul>) so that any changes to users[] will
	// reflect on the page immediately
	binder.attach(users, 'userlist', function (user) {
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

	// Chat form submission function
	$('#messageform').submit(function (e) {
		e.preventDefault();
		e.stopImmediatePropagation();
		socket.emit('chat_message', $('#m').val());
		$('#m').val('');
		return false; // Don't submit!
	});

	// Initialize message list handler with id of <ul> containing all the messages
	messageList.init('messages');



	// ~~ PACKET HANDLERS ~~ //

	// This handler catches the client up with stored messages from the server
	socket.on('ketchup', function (messages) {
		messages.forEach(messageList.addMessage);
	});


	// userArr contains user objects for every active in the room
	socket.on('who', function (userArr) {
		userArr.forEach(function (user) {
			users.push(user);
		});
	});

	
	// Receives a chat message object with 'displayName', 'content', and 'datetime'
	socket.on('chat_message', function (msg) {
		messageList.addMessage(msg);
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
