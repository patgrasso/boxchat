/**
 *  Name: messagelist.js
 *  Author: Patrick Grasso
 *  Description: This module manages everything that goes into the message box
 *      (that big <ul>) and how it goes in. This simplifies adding messages
 *      to the list and providing functionality to the message box.
 *  Dependencies:
 *      NONE
 */

/*jslint browser: true*/
/*global define*/

define(function () {
    'use strict';
    var rooms,
        ulid,
        currentRoom = 'general';


    // This will create a message list for a particular room. All messages are stored
    // in a "store" (a model) that is not displayed, but when activated, the room
    // plants its contents into the view and continues to broadcast to both the view
    // and the model until deactivated (after which, the room may only write to the model)
    function createRoomMessageList() {
        var viewObject = null,
            store = document.createElement('ul'),
            lastMessageTime,
            lastMessageOwner;

        // Creates a new message entry for the message list and returns the
        // li to be attached to the list
        function createNewEntry(msgObj) {
            var date = new Date(msgObj.datetime),
                li = document.createElement('li'),
                ownerSpan,
                timeSpan,
                contentParagraph;

            if (date - lastMessageTime > 60000 || msgObj.from !== lastMessageOwner) {
                ownerSpan = document.createElement('span');
                ownerSpan.setAttribute('class', 'messageUserName');
                ownerSpan.innerText = msgObj.from;

                timeSpan = document.createElement('span');
                timeSpan.setAttribute('class', 'messageTime');
                timeSpan.innerText = '  ' + date.toLocaleTimeString();


                li.appendChild(ownerSpan);
                li.appendChild(timeSpan);
            }

            contentParagraph = document.createElement('p');
            contentParagraph.innerText = msgObj.content;
            li.appendChild(contentParagraph);

            lastMessageTime = date;
            lastMessageOwner = msgObj.from;
            return li;
        }


        // Adds a message to the store and (if not null) the viewObject when active
        function addMessage(msgObj) {
            var isAtBottom,
                newEntry = createNewEntry(msgObj);

            if (viewObject !== null) {
                isAtBottom = viewObject.scrollHeight - viewObject.clientHeight <= viewObject.scrollTop + 1;
                viewObject.appendChild(newEntry.cloneNode(true));
            }
            store.appendChild(newEntry);

            if (isAtBottom) {
                viewObject.scrollTop = viewObject.scrollHeight - viewObject.clientHeight;
            }
        }


        // Clear all messages (in both the model and the view)
        function clearMessages() {
            store.innerHTML = '';
            if (viewObject) {
                viewObject.innerHTML = '';
            }
        }


        // Give this room the ability to write to the view and change the view to reflect
        // this room's store
        function activate(listObjectId) {
            viewObject = document.getElementById(listObjectId);
            viewObject.innerHTML = store.innerHTML;
        }


        // Nullify the view handle so that it cannot be written to
        function deactivate() {
            viewObject = null;
        }


        // Returns true if this room is active (has viewObject !== null), false otherwise
        function isActive() {
            if (viewObject) {
                return true;
            }
            return false;
        }


        // Jumps to the bottom of the message list (so that the scroll bar hits the bottom)
        function goToBottom() {
            if (viewObject) {
                viewObject.scrollTop = viewObject.scrollHeight - viewObject.clientHeight;
            }
        }


        return {
            addMessage: addMessage,
            clearMessages: clearMessages,
            activate: activate,
            deactivate: deactivate,
            isActive: isActive,
            goToBottom: goToBottom
        };

    }



    // ~~ Outer Functions ~~

    // If a room by the name of [roomName] does not already exist, it is
    // created and added to the associative list of rooms at the index of
    // its name
    function addRoom(roomName) {
        if (rooms[roomName] === undefined) {
            rooms[roomName] = createRoomMessageList();
        }
    }


    // Initializes the module by creating an empty rooms object (key = room name,
    // value = room object), and capturing the <ul>'s id so that it may be updated
    // accordingly
    function init(listObjectId) {
        rooms = {};
        ulid = listObjectId;

        // By default, the module loads currentRoom with 'general'
        rooms[currentRoom] = createRoomMessageList();
    }


    // Receives the incoming message. If the room specified by the message
    // does not already exist, it is created
    function addMessage(msgObj) {
        addRoom(msgObj.room);
        rooms[msgObj.room].addMessage(msgObj);
    }


    // Allows the room [roomName] to write to the view, as well as transfer its
    // current data over immediately after switching
    function switchToRoom(roomName) {
        rooms[currentRoom].deactivate();
        rooms[roomName].activate(ulid);
        rooms[roomName].goToBottom();
        currentRoom = roomName;
    }


    // Clear all the msesages in a room
    function clearMessages(roomName) {
        roomName = roomName || currentRoom;
        rooms[roomName].clearMessages();
    }


    return {
        addRoom: addRoom,
        init: init,
        addMessage: addMessage,
        switchToRoom: switchToRoom,
        clearMessages: clearMessages
    };
});
