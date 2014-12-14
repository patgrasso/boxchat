module.exports = function (filename) {
	var fs = require('fs');
	var archiveOutputStream;
	var messages;

	
	// Load messages from the archive file
	function loadMessageArchive(filename) {
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
		(return {
			from: dataArr[0],
			message: dataArr[1],
			datetime: dataArr[2]
		};
	}
	
	
	// Create a stream for appending new message data to the archive
	function appendStreamFuncFactory(filename) {
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
				ok = true;
			}
		}

		return write;
	};

	
	// Execute on load
	messages = loadMessageArchive(filename);
	archiveOutputStream = appendStreamFuncFactory(filename);

	return {
		messages: messages,
		write: archiveOutputStream
	};
};
