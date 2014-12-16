define(function () {
	var listObj,
		lastMessageTime,
		lastMessageOwner;

	function init(listObjectId) {
		listObj = document.getElementById(listObjectId);
	}


	// Creates a new message entry for the message list and returns the
	// li to be attached to the list
	function createNewEntry(msgObj) {
		var date = new Date(msgObj.datetime),
			li = document.createElement('li'),
			ownerSpan,
			timeSpan,
			contentParagraph;
		
		if (date - lastMessageTime > 60000 || msgObj.from !== lastMessageOwner) {
			ownerSpan = document.createElement('span');
			ownerSpan.setAttribute('class', 'messageUserName');
			ownerSpan.innerText = msgObj.from;

			timeSpan = document.createElement('span');
			timeSpan.setAttribute('class', 'messageTime');
			timeSpan.innerText = '  ' + date.toLocaleTimeString();


			li.appendChild(ownerSpan);
			li.appendChild(timeSpan);
		}

		contentParagraph = document.createElement('p');
		contentParagraph.innerText = msgObj.content;
		li.appendChild(contentParagraph);

		lastMessageTime = date;
		lastMessageOwner = msgObj.from;
		return li;
	}
	
	// Adds a message to the <ul> we have goin
	function addMessage(msgObj) {
        var isAtBottom = listObj.scrollHeight - listObj.clientHeight <= listObj.scrollTop + 1;

		listObj.appendChild(createNewEntry(msgObj));

		if (isAtBottom) {
			listObj.scrollTop = listObj.scrollHeight - listObj.clientHeight;
		}
	}

	return {
		init: init,
		addMessage: addMessage
	};

});
