
/*jslint regexp: true*/

var archiveConstructor = require('./message-archive');


function bind(socket, nsp) {
    'use strict';
    var user = socket.request.user,
        archive = archiveConstructor('message_archive_' + nsp.name.slice(1) + '.dat'),
        lastMessage = {};

    // Checks to see if a message should go to the user based on the user's current room and
    // the message's destination room. Sort of like a mail sorter
    function shouldGoToUser(message) {
        return user.currentRoom === message.room;
    }


    // Sends all of a room's messages to the user in appropriately sized chunks
    function sendMessagesForRoom() {
        var i;

        socket.emit('ketchup', 'begin');
        for (i = 40; i < archive.messages.length; i += 40) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i).filter(shouldGoToUser));
        }
        if (i >= archive.messages.length) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i).filter(shouldGoToUser));
        }
    }



    // ~~ Handlers ~~ //

    // Chat Message
    function onChatMessage(msg) {
        var join = /^\/join (.*)/,      // Temporary - replace with parser
            leave = /^\/leave (.*)/;    // Temporary - replace with parser

        if (user.permissions.chat === true) {
            lastMessage = {
                from: user.displayName,
                content: msg.content,
                datetime: new Date().toGMTString(),
                room: msg.room
            };

            // Temporary - same as above
            join = msg.content.match(join);
            leave = msg.content.match(leave);
            if (join !== null && join[1] !== '') {
                socket.joinRoom(join[1], function () {
                    console.log(user.rooms);
                });
                socket.emit('my_profile', user);
            } else if (leave !== null && leave[1] !== '') {
                socket.leaveRoom(leave[1], function () {
                    console.log(user.rooms);
                });
                socket.emit('my_profile', user);
            } else {
                if (user.rooms.indexOf(lastMessage.room) !== -1) {
                    console.log(lastMessage);
                    archive.messages.push(lastMessage);
                    archive.write(lastMessage);
                    nsp.to(lastMessage.room).emit('chat_message', lastMessage);
                }
            }
        }
    }


    // Switches the user's current room so that only messages sent to that room
    // will be relayed to the user. If the user is not subscribed to the given
    // room, an acknowledgment packet containing 'false' will be sent to the user,
    // otherwise that packet will contain 'true'
    function onRoomSwitch(roomInfo, callback) {
        if (user.rooms.indexOf(roomInfo.room) !== -1) {
            user.currentRoom = roomInfo.room;
            callback(true);
            sendMessagesForRoom();
        } else {
            callback(false);
        }
    }


    // Notifies all other users when a user disconnects
    function onDisconnect() {
        console.log(user.displayName + ' has disconnected');
        nsp.emit('user_status', user.toStatusUser('offline'));
    }


    socket.on('chat_message', onChatMessage);
    socket.on('room_switch', onRoomSwitch);
    socket.on('disconnect', onDisconnect);


    return {
        sendMessagesForRoom: sendMessagesForRoom
    };
}


module.exports = {
    bind: bind
};
