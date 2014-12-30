


/*global define*/

define(['binder', 'messagelist'], function (binder, messagelist) {
    'use strict';
    var rooms = binder.observable(), // TODO: implement observable
        currentRoom;

    // ~~ PRIVATE ~~ //

    // Factory for creating a room. Attaches a message handler (so that messages
    // can be pushed to the room) from messagelist and .... 
    // TODO: Add more stuff (if necessary, obviously)
    function createRoom(roomName) {
        var messageHandler = messagelist.createRoomMessageList(),
            myName = roomName;

        // Calls the messagelist module's switchToRoom() method to forward this
        // room's messages to the view
        function focus(listId) {
            rooms[currentRoom].deactivate();
            rooms[myName].activate(listId);
            rooms[myName].goToBottom();
            currentRoom = myName;
        }

        return {
            name: myName,
            addMessage: messageHandler.addMessage,
            clearMessages: messageHandler.clearMessages,
            focus: focus
        };
    }


    // Simple check to see if a room is already in the collection
    function roomExists(roomName) {
        return rooms.indexOf(roomName) !== -1;
    }



    // ~~ PUBLIC ~~ //

    // Adds a room to the collection if a room with the same name does not
    // already exist
    function addRoom(roomName) {
        if (rooms.indexOf(roomName) === -1) {
            rooms[roomName] = createRoom(roomName);
            return true;
        }
        return false;
    }


    // Adds a message to the appropriate room using the passed in object's
    // 'room' attribute. If the room does not exist, the message is discarded
    function addMessage(msgObj) {
        if (roomExists(msgObj.room)) {
            rooms[msgObj.room].addMessage(msgObj);
            return true;
        }
        return false;
    }


    // Clears the messages in a certain room
    function clearMessages(roomName) {
        roomName = roomName || currentRoom;
        if (roomExists(roomName)) {
            rooms[roomName].clearMessages();
        }
    }


    return {
        addRoom: addRoom,
        addMessage: addMessage,
        clearMessages: clearMessages
    };
});
