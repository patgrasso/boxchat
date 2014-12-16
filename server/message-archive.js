/**
 *  Name: message-archive.js
 *  Author: Patrick Grasso
 *  Description: message-archive.js controls the archive files for stored
 *      messages (and other information). On server startup (when the module's
 *      main function is called), all messages are loaded from the archive file
 *      into a list. Any time a user connects, that list is sent to them so that
 *      it may appear as if they never left the chatroom! Every message received
 *      by the server gets stored in the archive file.
 *
 *      Also, writing to the archive file is done cleverly in such a way that if
 *      two messages are received at once (which would ordinarily cause one of
 *      them to fail in writing to the file), both will be written, one after the
 *      other.
 *  Dependencies:
 *      fs - Node.js's filesystem module
 */

/*jslint node: true*/

module.exports = function (filename) {
    'use strict';
    var fs = require('fs'),
        archiveOutputStream,
        messages;


    // Creates an object from an an entry in the message archive
    function createMessageFromArchive(line) {
        var dataArr = JSON.parse(line);
        return {
            from: dataArr[0],
            content: dataArr[1],
            datetime: dataArr[2]
        };
    }


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
        return JSON.stringify([msg.from, msg.content, msg.datetime]);
        //return '["' + msg.from + '","' + msg.content + '","' + msg.datetime + '"]';
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

        function archiveMessage(msg) {
            write(formatMessageToArchive(msg));
        }

        return archiveMessage;
    }


    // Execute on load
    messages = loadMessageArchive(filename);
    archiveOutputStream = appendStreamFuncFactory(filename);

    return {
        messages: messages,
        write: archiveOutputStream
    };
};
