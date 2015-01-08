/**
 *  Name: chat-client.js
 *  Author: Patrick Grasso
 *  Description: Entry-point for require.js / socket.io handler for the client.
 *      The socket.io portion for messages from the server and abides by standards
 *      in packet_protocol.txt. This module also manages connected user profiles
 *      and their statuses (as reported by the server).
 *  Dependencies:
 *      binder - Javascript Object - DOM Element data binding utility
 *      messageList - Manager for the big message box <ul> on the page
 *      rooms - Stores information about each room and provides functions that
 *          involve rooms (e.g. changing rooms)
 *      notifications - Handles all notifications
 *      socket-wrapper - socket.io object that allows the client to communicate via
 *          websockets with the server
 */

/*jslint browser: true*/
/*global $, io, alert*/


require(['binder',
         'messagelist',
         'rooms',
         'notifications',
         'socket-wrapper'
        ],

    function (binder, messageList, rooms, notifications, socket) {
        'use strict';
        var users = {},
            self,

            usersTyping = (function () {
                var peopleWhoAreTyping = [];

            })();


        // Bind users[] to #online_users (<ul>) so that any changes to users[] will
        // reflect on the page immediately
        binder.attach(users, 'userlist', function (user) {
            return user; // Return the user's name to be displayed in the <li>
        });


        // Chat form submission function
        $('#messageform').submit(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            socket.emit('chat_message', {
                content: $('#m').val(),
                room: rooms.currentRoom
            });
            $('#m').val('');
            return false;
        });


        // Change room form submission function
        $('#switchroom').submit(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (self.rooms.indexOf($('#r').val()) === -1) {
                alert('You are not a member of that room.\nEnter /join [room] to join a room.');
                return false;
            }
            rooms.enter($('#r').val());
            $('#r').val('');
            return false;
        });


        // Initialize notifications
        notifications.init();



        // ~~ PACKET HANDLERS ~~ //

        // This handler catches the client up with stored messages from the server
        socket.on('ketchup', function (messages) {
            if (messages === 'begin') {
                messageList.clearMessages();
            } else {
                messages.forEach(messageList.addMessage);
            }
        });


        // userArr contains user objects for every active in the room
        socket.on('who', function (userArr) {
            Object.keys(users).forEach(function (username) {
                delete users[username];
            });
            userArr.forEach(function (user) {
                users[user.displayName] = user;
            });
        });


        // Receives a chat message object with 'displayName', 'content', and 'datetime'
        socket.on('chat_message', function (msg) {
            if (msg.room === rooms.currentRoom) {
                messageList.addMessage(msg);
                notifications.push(msg);
            } else {
                rooms.newMessage(msg);
            }
        });


        // Contains status information on a user in property 'stat'. See the protocol
        // document for more information on what this might contain
        socket.on('user_status', function (user) {
            if (user.stat === 'offline') {
                delete users[user.displayName];
            } else {
                users[user.displayName] = user;
            }
        });


        // Provides start-up information with this user's profile, information about
        // other connected users, and room info (just the names)
        socket.on('whats_the_weather_like', function (report) {
            self = report.myProfile;
            report.rooms.forEach(function (room) {
                rooms.addRoom(room);
            });
            rooms.enter(report.currentRoom);
        });


        // Indicates whether a user is typing or not in a certain room
        socket.on('user_typing', function (msg) {
            if (msg.isTyping === true) {
                usersTyping.addPerson(msg.displayName);
            } else if (msg.isTyping === false) {
                usersTyping.removePerson(msg.displayName);
            }
        });

    });
