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



    // Connection handler
    io.on('connection', function (socket) {
        var user = socket.request.user,
            lastMessage = {},
            i;

        // Bind methods to our socket
        attachMethodsToSocket(socket);

        // Set user's status to ONLINE
        user.stat = USER_STATUS.online;

        // Join all the rooms this member is a part of
        user.rooms.forEach(function (room) {
            socket.join(room);
        });

        // Let everybody know that user has connected
        console.log(user.displayName + ' has connected');
        socket.broadcast.emit('user_status', users.toStatusUser(user, 'online'));

        // Catch the user up with messages and active users
        socket.emit('who', users.getAll(['displayName', 'stat']));
        socket.emit('my_profile', user);

        socket.emit('ketchup', 'begin');
        for (i = 40; i < archive.messages.length; i += 40) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i));
        }
        if (i >= archive.messages.length) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i));
        }


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
                } else if (leave !== null && leave[1] !== '') {
                    socket.leaveRoom(leave[1], function (err) {
                        console.log(user.rooms);
                    });
                } else {
                    console.log(lastMessage);
                    archive.messages.push(lastMessage);
                    archive.write(lastMessage);
                    io.to(lastMessage.room).emit('chat_message', lastMessage);
                }
            }
        });


        // Disconnect
        socket.on('disconnect', function () {
            console.log(user.displayName + ' has disconnected');
            io.emit('user_status', users.toStatusUser(user, 'offline'));
        });
    });


    return io;
};
