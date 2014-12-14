(function () {
	var socket = io();
	var users = [];

	// Attach method to remove active users
	users.removeUser = function (user) {
		var i, newArr = this.filter(function (el) {
			return el.displayName !== user.displayName;
		});
		this.length = 0;
		for (i = 0; i < newArr.length; i += 1) {
			this.push(newArr[i]);
		}
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
			$('#messages').append($('<li>').text(msg.from + ' : ' + msg.message)
										.css('color', color));
		}
	}

	function updateOnlineUsers() {
		$('#online_users').empty();
		users.forEach(function (user) {
			$('#online_users').append($('<li>').text(user.displayName).css('color', '#449d44'));
		});
	}


	// Packet handlers
	socket.on('ketchup', function (messages) {
		messages.forEach(addMessage);
	});

	socket.on('who', function (userArr) {
		users = userArr;
		updateOnlineUsers();
	});

	socket.on('chat_message', function (msg) {
		addMessage(msg);
	});

	socket.on('user_status', function (obj) {
		console.log(obj);
		if (obj.verbose) {
			addMessage(obj.user + ' is now ' + obj.stat, (obj.stat === 'offline')
															 ? '#d9534f'
															 : '#449d44', true);
		}
		if (obj.stat === 'online') {
			users.push({
				displayName: obj.user,
				stat: obj.stat
			});
		} else {
			users.removeUser({displayName: obj.user});
		}
		updateOnlineUsers();
	});
})();
