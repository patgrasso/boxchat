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
        currentRoom;

    // Class for handling a room's messages
    // TODO: More documentation here
    function createRoomMessageList() {
        var listObj = document.createElement('ul'),
            lastMessageTime,
            lastMessageOwner,
            active = false;

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


        // Adds a message to the <ul> we have goin
        function addMessage(msgObj) {
            var isAtBottom;

            if (listObj === undefined) {
                listObj = document.createElement('ul');
            }

            isAtBottom = listObj.scrollHeight - listObj.clientHeight <= listObj.scrollTop + 1;

            listObj.appendChild(createNewEntry(msgObj));

            if (isAtBottom) {
                listObj.scrollTop = listObj.scrollHeight - listObj.clientHeight;
            }
        }


        // Clear all messages
        function clearMessages() {
            listObj.innerHTML = '';
        }


        // Set a <ul>'s innerHTML to this room list's innerHTML
        function applyTo(listObjectId) {
            if (listObj !== undefined) {
                document.getElementById(listObjectId).innerHTML = listObj.innerHTML;
            }
            listObj = document.getElementById(listObjectId);
            active = true;
        }


        // Set the listObj to a new <ul> and copy over the data
        function unApply() {
            var newListObj = document.createElement('ul');
            newListObj.innerHTML = listObj.innerHTML;
            listObj = newListObj;
            active = false;
        }


        function isActive() {
            return active;
        }


        return {
            addMessage: addMessage,
            clearMessages: clearMessages,
            applyTo: applyTo,
            unApply: unApply,
            isActive: isActive
        };

    }


    // Adds a room to the rooms object
    function addRoom(roomName) {
        if (rooms[roomName] === undefined) {
            rooms[roomName] = createRoomMessageList();
        }
    }


    // Initializes the module
    function init(listObjectId) {
        rooms = {};
        ulid = listObjectId;
    }


    // Adds a message to the appropriate room
    function addMessage(msgObj) {
        if (Object.keys(rooms).length === 0) {
            return false;
        }
        rooms[msgObj.room].addMessage(msgObj);
        return true;
    }


    // Switch the message list content to the specific room's content
    function switchToRoom(roomName) {
        Object.keys(rooms).forEach(function (room) {
            if (rooms[room].isActive()) {
                rooms[room].unApply();
            }
        });
        rooms[roomName].applyTo(ulid);
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
