/**
 *  Name: typinghint.js
 *  Author: Patrick Grasso
 *  Description: This module handles the 'user typing...' feature that most
 *      modern chat applications have. It exposes a global function that can be
 *      attached to the chat input box's onkeydown method which will keep track
 *      of when the user is typing and when they are not, and accordingly
 *      reporting this information to the server, which is then relayed to
 *      other users.
 *
 *      The other half of this module has an observable array for users typing,
 *      and a computed function for the 'is typing...', 'are typing...' detail.
 *  Dependencies:
 *      binder - knockout.js wrapper for the typing users observable array.
 *      knockout-3.2.0 - knockout.js for the computed detail
 *      socket-wrapper - Needed to be able to talk to the server.
 */

/*global define, document*/

define(['binder', 'knockout-3.2.0', 'socket-wrapper'], function (binder, ko, socket) {
    'use strict';
    var typingUsers = binder.observableArray(document.getElementById('usersTyping'), true),
        isCurrentlyTyping = false,
        keyPressCount = 0;

    typingUsers.attachToVM('typingSuffix', ko.computed(function () {
        if (typingUsers.vm.items().length <= 0) {
            return '';
        }
        if (typingUsers.vm.items().length === 1) {
            return ' is typing...';
        }
        return ' are typing...';
    }));

    typingUsers.applyBindings();


    function addPerson(displayName) {
        typingUsers.push(displayName);
    }


    function removePerson(displayName) {
        typingUsers.remove(displayName);
    }


    // Detecting when a user begins/stops typing
    global.messageFormKeyPress = function () {
        if (isCurrentlyTyping === false) {
            socket.emit('user_typing', true);
        }
        isCurrentlyTyping = true;
        keyPressCount += 1;
        setTimeout(function () {
            keyPressCount -= 1;
            console.log(keyPressCount);
            if (keyPressCount === 0) {
                isCurrentlyTyping = false;
                socket.emit('user_typing', false);
            }
            if (keyPressCount < 0) {
                keyPressCount = 0;
            }
        }, 1000);
    };

    // Override the 'user typing' mechanism and declare that a user
    // is done typing
    function stopTyping() {
        keyPressCount = 0;
        isCurrentlyTyping = false;
        socket.emit('user_typing', false);
    }


    return {
        addPerson: addPerson,
        removePerson: removePerson,
        stopTyping: stopTyping
    };
});
