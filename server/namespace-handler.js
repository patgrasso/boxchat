
/*jslint node:true, regexp: true*/

var archive = require('./message-archive')('message_archive.dat'),
    auth = require('./auth'),
    users = require('./users'),

    USER_STATUS = {
        online: 'online',
        offline: 'offline',
        away: 'away'
    };



// Connection handler
module.exports = function (socket, nsp, box) {
    'use strict';
    var user = socket.request.user,
        lastMessage = {};


    // First and foremost, kick the user out if they don't belong within the namespace (box)
    if (!box.isMember(user.username)) {
        socket.disconnect();
    }



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




    // Initialize the user
    (function () {
        var requestedRoom = socket.request.headers.referer.match(/\/chat\/(.*)/);

        if (requestedRoom !== null) {
            requestedRoom = requestedRoom[1];
        }
        if (user.rooms.indexOf(requestedRoom) === -1) {
            requestedRoom = null;
        }

        // Set user's status to ONLINE
        user.stat = USER_STATUS.online;

        // Join all the rooms this member is a part of
        user.rooms.forEach(function (room) {
            socket.join(room);
        });

        // If the url specified a certain room after /chat/, let's put them in that room
        user.currentRoom = requestedRoom || 'general';// FIXME replace with default room once accounts are made

        // Let everybody know that user has connected
        console.log(user.displayName + ' has connected');
        console.log(user);
        socket.broadcast.emit('user_status', user.toStatusUser('online'));

        // Catch the user up with messages and active users
        socket.emit('whats_the_weather_like', {
            myProfile: user.only(['username', 'displayName', 'rooms', 'permissions']),
            rooms: box.rooms.getAllRooms(),
            currentRoom: user.currentRoom
        });
        socket.emit('who', users.getAll(['displayName', 'stat', 'rooms']));

        sendMessagesForRoom();
    })();


    // ~~ Handlers ~~

    // Chat Message
    socket.on('chat_message', function (msg) {
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
    });


    // Switches the user's current room so that only messages sent to that room
    // will be relayed to the user. If the user is not subscribed to the given
    // room, an acknowledgment packet containing 'false' will be sent to the user,
    // otherwise that packet will contain 'true'
    socket.on('room_switch', function (roomInfo, callback) {
        if (user.rooms.indexOf(roomInfo.room) !== -1) {
            user.currentRoom = roomInfo.room;
            callback(true);
            sendMessagesForRoom();
        } else {
            callback(false);
        }
    });


    // Disconnect
    socket.on('disconnect', function () {
        console.log(user.displayName + ' has disconnected');
        nsp.emit('user_status', user.toStatusUser('offline'));
    });
};
