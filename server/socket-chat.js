/**
 *  Name: socket-chat.js
 *  Author: Patrick Grasso
 *  Description: socket-chat handles all of the socket.io implementation.
 *      All socket.io messages received from each client are archived and
 *      sent outward to every client. The protocol for the types of
 *      messages recognized by this module and the corresponding client
 *      socket.io module is spelled out in packet_protocol.txt in the
 *      project's home folder.
 *  Dependencies:
 *      http - The require('http').Server object created in index.js
 *      auth - The authorization object initialized in index.js (but
 *          comes from the auth.js module)
 */

/*jslint node: true, regexp: true*/

module.exports = function (http, auth) {
    'use strict';
    // Initialize modules
    var io = require('socket.io')(http),
        passportSocketIO = require('passport.socketio'),
        archive = require('./message-archive')('message_archive.dat'),
        users = require('./users')(io, auth),
        rooms = require('./rooms')(io, auth),

        // Global protocol objects
        CHAT_AUX_TYPE = {
            startTyping: 'start_typing',
            stopTyping: 'stop_typing'
        },

        USER_STATUS = {
            online: 'online',
            offline: 'offline',
            away: 'away'
        };


    // Use passport.socketio to store user data in socket.request.user
    io.use(passportSocketIO.authorize({
        cookieParser:   auth.cookieParser,
        secret:         'cat keyboard',
        store:          auth.store,
        passport:       auth.passport,
    }));


    function attachMethodsToSocket(socket) {
        rooms.bind(socket);
    }


    function attachMethodsToUser(user) {
        users.bind(user);
    }



    // Connection handler
    io.on('connection', function (socket) {
        var user = socket.request.user,
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


        // Initialize the user
        (function () {
            // Bind methods to our socket and user
            attachMethodsToSocket(socket);
            attachMethodsToUser(user);

            // Set user's status to ONLINE
            user.stat = USER_STATUS.online;

            // Join all the rooms this member is a part of
            user.rooms.forEach(function (room) {
                socket.join(room);
            });
            user.currentRoom = null;

            // Let everybody know that user has connected
            console.log(user.displayName + ' has connected');
            console.log(user);
            socket.broadcast.emit('user_status', user.toStatusUser('online'));

            // Catch the user up with messages and active users
            socket.emit('whats_the_weather_like', {
                myProfile: user.only(['username', 'displayName', 'rooms', 'permissions']),
                rooms: rooms.getAllRooms()
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
                    socket.joinRoom(join[1], function (err) {
                        console.log(user.rooms);
                    });
                    socket.emit('my_profile', user);
                } else if (leave !== null && leave[1] !== '') {
                    socket.leaveRoom(leave[1], function (err) {
                        console.log(user.rooms);
                    });
                    socket.emit('my_profile', user);
                } else {
                    if (user.rooms.indexOf(lastMessage.room) !== -1) {
                        console.log(lastMessage);
                        archive.messages.push(lastMessage);
                        archive.write(lastMessage);
                        io.to(lastMessage.room).emit('chat_message', lastMessage);
                    }
                }
            }
        });


        // Switches the user's current room so that only messages sent to that room
        // will be relayed to the user
        socket.on('room_switch', function (roomInfo) {
            if (user.rooms.indexOf(roomInfo.room) !== -1) {
                user.currentRoom = roomInfo.room;
                sendMessagesForRoom();
            }
        });


        // Disconnect
        socket.on('disconnect', function () {
            console.log(user.displayName + ' has disconnected');
            io.emit('user_status', user.toStatusUser('offline'));
        });
    });


    return io;
};
