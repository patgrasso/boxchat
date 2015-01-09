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
 *      app - The express application object which is used to add
 *          room-specific routing
 */

/*jslint node: true*/

module.exports = function (http, auth) {
    'use strict';
    // Initialize modules
    var io = require('./io-wrapper')(http),
        passportSocketIO = require('passport.socketio'),
        users = require('./users'),
        boxes = require('./boxes'),
        namespaceHandler = require('./namespace-handler'),
        namespaces = {},

        // Global protocol objects
        CHAT_AUX_TYPE = {
            startTyping: 'start_typing',
            stopTyping: 'stop_typing'
        };


    function attachMethodsToSocket(socket, box) {
        if (!boxes.bind(socket, box)) {
            socket.emit('error', {
                message: 'You are not a member of any box. Please join a box or ' +
                    'create one of your own.',
                disconnect: true
            });
        }
    }


    function attachMethodsToUser(user) {
        users.bind(user);
    }



    // Create namespaces for each box (account) and apply the connection handler
    function createNamespaces(boxArray) {
        boxArray.forEach(function (box) {
            namespaces[box.name] = io.of('/' + box.name);

            // Use passport.socketio to store user data in socket.request.user
            namespaces[box.name].use(passportSocketIO.authorize({
                cookieParser:   auth.cookieParser,
                secret:         'cat keyboard',
                store:          auth.store,
                passport:       auth.passport,
            }));

            namespaces[box.name].on('connection', function (socket) {
                attachMethodsToSocket(socket, box);
                attachMethodsToUser(socket.request.user);
                namespaceHandler(socket, namespaces[box.name], box);
            });
        });
    }


    boxes.loadBoxes(createNamespaces);


    return io;
};
