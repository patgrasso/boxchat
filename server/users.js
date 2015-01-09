/**
 *  Name: users.js
 *  Author: Patrick Grasso
 *  Description: This module has some functions that allow the User{} objects
 *      to be converted for different purposes. The intention of this module
 *      was to simplify global user access, but there is not a ton of need
 *      for that anyway (so far) so this module is relatively simplistic
 *  Dependencies:
 *      io - socket.io object that contains all active client user objects on
 *          it thanks to passport.socketio
 */

/*jslint node: true*/

var auth = require('./auth'),
    io = require('./io-wrapper');

// Return an array of objects, each containing the properties specified
function getAll(propertyList) {
    'use strict';
    var clients = io.eio.clients,
        userObjects = [],
        userInfo;

    Object.keys(clients).map(function (uid) {
        userInfo = { id: clients[uid].request.user.id };
        propertyList.forEach(function (property) {
            if (clients[uid].request.user[property] !== undefined) {
                userInfo[property] = clients[uid].request.user[property];
            }
        });
        userObjects.push(userInfo);
    });

    return userObjects;
}


// Creates a user status object for relaying a user's status to others
function toStatusUser(stat, verbose) {
    'use strict';
    return {
        displayName: this.displayName,
        stat: stat || this.stat,
        verbose: verbose || false
    };
}


// Returns a user object with ONLY the attributes specified in the first
// parameter as an array (name attributes by string)
function only(attributes) {
    'use strict';
    var that = this,
        returnUser = {};

    attributes.forEach(function (attr) {
        returnUser[attr] = that[attr];
    });

    return returnUser;
}


// Disables chat functionality for a certain user. The admin's user
// object must be passed as the first parameter
function disableChat(adminUser, targetUser) {
    'use strict';
    if (adminUser.permissions.admin === true) {
        targetUser.permissions.chat = false;

        return auth.update(targetUser, {
            permissions: targetUser.permissions
        });
    }
    return false;
}

// Bind methods to a user object
function bind(user) {
    'use strict';
    user.toStatusUser = toStatusUser;
    user.only = only;
}


module.exports = {
    getAll: getAll,
    disableChat: disableChat,
    bind: bind
};
