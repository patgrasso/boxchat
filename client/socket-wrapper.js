/**
 *  Name: socket-wrapper.js
 *  Author: Patrick Grasso
 *  Description: This module allows for the socket object to be required from
 *      multiple modules, as it needs to be initialized and cannot be initialized
 *      from more than one module.
 *  Dependencies:
 *      socket.io - The client-side socket.io script that allows real-time
 *          communication with the server
 */

/*jslint browser: true*/
/*global define*/


define(['../socket.io/socket.io.js'], function (io) {
    'use strict';
    var request = new XMLHttpRequest();
    request.open('GET', '/userInfo/box', false);
    request.send(null);

    if (request.status === 200) {
        return io('/' + request.responseText);
    }
    return null;
});
