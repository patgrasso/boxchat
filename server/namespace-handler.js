
/*jslint node:true, regexp: true*/

var auth = require('./auth'),
    users = require('./users'),
    messageHandler = require('./message-handler'),

    USER_STATUS = {
        online: 'online',
        offline: 'offline',
        away: 'away'
    };



// Connection handler
module.exports = function (socket, nsp, box) {
    'use strict';
    var user = socket.request.user,
        messages = messageHandler.bind(socket, nsp),
        requestedRoom;

    // First and foremost, kick the user out if they don't belong within the namespace (box)
    if (!box.isMember(user.username)) {
        socket.disconnect();
    }

    requestedRoom = socket.request.headers.referer.match(/\/chat\/(.*)/);

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
    socket.broadcast.emit('user_status', user.toStatusUser('online'));

    // Catch the user up with messages and active users
    socket.emit('whats_the_weather_like', {
        myProfile: user.only(['username', 'displayName', 'rooms', 'permissions']),
        rooms: box.rooms.getAllRooms(),
        currentRoom: user.currentRoom
    });
    socket.emit('who', users.getAll(['displayName', 'stat', 'rooms']));
};
