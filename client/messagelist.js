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
    var listObj,
        lastMessageTime,
        lastMessageOwner;

    function init(listObjectId) {
        listObj = document.getElementById(listObjectId);
    }


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
        var isAtBottom = listObj.scrollHeight - listObj.clientHeight <= listObj.scrollTop + 1;

        listObj.appendChild(createNewEntry(msgObj));

        if (isAtBottom) {
            listObj.scrollTop = listObj.scrollHeight - listObj.clientHeight;
        }
    }


    // Clear all messages
    function clearMessages() {
        listObj.innerHTML = '';
    }

    return {
        init: init,
        addMessage: addMessage,
        clearMessages: clearMessages
    };

});
