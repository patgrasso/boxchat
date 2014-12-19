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

/*jslint node: true*/

module.exports = function (http, auth) {
    'use strict';
    // Initialize modules
    var io = require('socket.io')(http),
        passportSocketIO = require('passport.socketio'),
        archive = require('./message-archive')('message_archive.dat'),
        users = require('./users')(io, auth),

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


    // Connection handler
    io.on('connection', function (socket) {
        var user = socket.request.user,
            lastMessage = {},
            i;

        // Set user's status to ONLINE
        user.stat = USER_STATUS.online;

        // Let everybody know that user has connected
        console.log(user.displayName + ' has connected');
        socket.broadcast.emit('user_status', users.toStatusUser(user, 'online'));

        // Catch the user up with messages and active users
        socket.emit('ketchup', 'begin');

        for (i = 40; i < archive.messages.length; i += 40) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i));
        }
        if (i >= archive.messages.length) {
            socket.emit('ketchup', archive.messages.slice(i - 40, i));
        }

        socket.emit('who', users.getAll(['displayName', 'stat']));


        // Chat Message
        socket.on('chat_message', function (msg) {
            if (user.permissions.chat === true) {
                lastMessage = {
                    from: user.displayName,
                    content: msg,
                    datetime: new Date().toGMTString()
                };

                console.log(lastMessage);
                archive.messages.push(lastMessage);
                archive.write(lastMessage);
                io.emit('chat_message', lastMessage);
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
