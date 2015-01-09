/**
 *  Name: rooms.js
 *  Author: Patrick Grasso
 *  Description: Objects for each room are kept here, with information about each.
 *      Right now, this includes the room's name and number of unread messages.
 *  Dependencies:
 *      socket-wrapper - Socket.io wrapper module with ready-to-use socket object
 */

/*jslint browser: true*/
/*global define*/


define(['socket-wrapper', 'binder', 'knockout-3.2.0'], function (socket, binder, ko) {
    'use strict';
    var rooms = binder.observableArray(document.getElementById('roomlist')),
        currentRoom,
        returnObject;

    // ~~ PRIVATE ~~ //

    // Factory for creating a room. Attaches a message handler (so that messages
    // can be pushed to the room) from messagelist and .... 
    function createRoom(roomName) {
        var myName = roomName,
            unseenMessages = ko.observable(0);

        return {
            name: myName,
            unseenMessages: unseenMessages
        };
    }


    // Simple check to see if a room is already in the collection
    function roomExists(roomName) {
        return rooms.contains(function (item) {
            return item.name === roomName;
        });
    }



    // ~~ PUBLIC ~~ //

    // Adds a room to the collection if a room with the same name does not
    // already exist
    function addRoom(roomName) {
        if (!roomExists(roomName)) {
            rooms.push(createRoom(roomName));
            return true;
        }
        return false;
    }


    // Switches to a new room by setting currentRoom to a new valid room name.
    // This is only done after we send a room_switch request to the server
    // (packet request, not to be confused with an HTTP request) and if the
    // callback value is set to true, change currentRoom and push a history
    // state using the history API so the URL reflects this room change
    function enterRoom(roomName, doPushHistoryState) {
        if (roomExists(roomName)) {
            socket.emit('room_switch', {
                room: roomName
            }, function (allowedToJoin) {
                if (allowedToJoin === true && history) {
                    currentRoom = roomName;
                    if (doPushHistoryState !== false) {
                        history.pushState({room: currentRoom}, currentRoom, '/chat/' + currentRoom);
                    }
                }
            });
            return true;
        }
        return false;
    }


    // In case a user hits the back or forward buttons, let's change the room
    // to what it was at that time
    window.onpopstate = function (event) {
        if (event.state !== null && event.state !== undefined) {
            enterRoom(event.state.room, false);
        }
    };


    // Adds 1 to 'unseenMessages' for a given room
    function incrementMessageCount(messageObj) {
        var roomObj;

        if (typeof messageObj === 'object') {
            messageObj = messageObj.room;
        }
        if (messageObj !== currentRoom) {
            roomObj = rooms.get(function (item) {
                return item.name === messageObj;
            });
            roomObj.unseenMessages(roomObj.unseenMessages() + 1);
        }
    }


    returnObject = {
        addRoom: addRoom,
        enter: enterRoom,
        newMessage: incrementMessageCount
    };

    Object.defineProperty(returnObject, 'currentRoom', {
        get: function () {
            return currentRoom;
        }
    });

    return returnObject;
});
