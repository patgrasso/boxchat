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


define(['binder', 'messagelist', 'socket-wrapper'], function (binder, messagelist, socket) {
    'use strict';
    var rooms = {},//binder.observable(), // TODO: implement observable
        currentRoom,
        returnObject;

    // ~~ PRIVATE ~~ //

    // Factory for creating a room. Attaches a message handler (so that messages
    // can be pushed to the room) from messagelist and .... 
    // TODO: Add more stuff (if necessary, obviously)
    function createRoom(roomName) {
        var myName = roomName,
            unseenMessages = 0;

        return {
            name: myName,
            unseenMessages: unseenMessages
        };
    }


    // Simple check to see if a room is already in the collection
    function roomExists(roomName) {
        return rooms[roomName] !== undefined;
    }



    // ~~ PUBLIC ~~ //

    // Adds a room to the collection if a room with the same name does not
    // already exist
    function addRoom(roomName) {
        if (!roomExists(roomName)) {
            rooms[roomName] = createRoom(roomName);
            return true;
        }
        return false;
    }


    // Switches to a new room by setting currentRoom to a new valid room name
    function enterRoom(roomName) {
        if (roomExists(roomName)) {
            currentRoom = roomName;
            socket.emit('room_switch', {
                room: currentRoom
            });
            return true;
        }
        return false;
    }


    // Adds 1 to 'unseenMessages' for a given room
    function incrementMessageCount(messageObj) {
        if (typeof messageObj === 'object') {
            messageObj = messageObj.room;
        }
        if (messageObj !== currentRoom) {
            rooms[messageObj].unseenMessages += 1;
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
