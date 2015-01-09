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
    var MESSAGE_LIST_ID = 'messages',
        viewObject = document.getElementById(MESSAGE_LIST_ID),
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

        if (isAtBottom) {
            viewObject.scrollTop = viewObject.scrollHeight - viewObject.clientHeight;
        }
    }


    // Clear all messages (in both the model and the view)
    function clearMessages() {
        if (viewObject) {
            viewObject.innerHTML = '';
            lastMessageTime = null;
            lastMessageOwner = null;
        }
    }


    // Sets the DOM node to which new messages will be appended (gets elem by ID)
    function setBroadcastId(listObjectId) {
        viewObject = document.getElementById(listObjectId) ||
            document.getElementById(MESSAGE_LIST_ID);
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
        setBroadcastId: setBroadcastId,
        goToBottom: goToBottom
    };

});
