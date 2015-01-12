
/*jslint node: true*/

var mongoose = require('mongoose/');
var observable = require('./observable-proto');

mongoose.connect('mongodb://localhost/BoxChatDB');

var Schema = mongoose.Schema;
var UserDetail = new Schema({
        username: String,
        password: String,
        salt: String,
        displayName: String,
        permissions: {
            admin: Boolean,
            chat: Boolean
        },
        rooms: Array,
        box: String,
        accountStatus: String
    }, {
        collection: 'userInfo'
    });
var UserDetails = mongoose.model('userInfo', UserDetail);

// Box Information
var BoxDetail = new Schema({
        name: String,
        plugins: Object,
        users: Array,
        rooms: Array,
        invites: Array,
        defaultRoom: String
    }, {
        collection: 'boxInfo'
    });
var BoxDetails = mongoose.model('boxInfo', BoxDetail);


// ~~ BOXES ~~ //
var boxes = {};
var boxObservable = observable();


boxes.subscribe = function (notifyFunction) {
    'use strict';
    if (!notifyFunction || typeof notifyFunction !== 'function') {
        throw 'Must provide a notify function as a parameter';
    }
    return boxObservable.addObserver(notifyFunction);
};

boxes.unsubscribe = function (subscriptionId) {
    'use strict';
    boxObservable.removeObserver(subscriptionId);
};



function addXToBox(thing, boxName, x) {
    'use strict';
    if (thing === undefined || boxName === undefined || x === undefined) {
        return;
    }
    BoxDetails.find({
        name: boxName
    }, function (err, data) {
        if (err || data.length !== 1) {
            console.log(err);
            return;
        }
        data = data[0];
        if (data[x].indexOf(thing) !== -1) {
            return;
        }
        data[x].push(thing);
        data.save();
    });
}


function removeXFromBox(thing, boxName, x) {
    'use strict';
    var index;

    if (thing === undefined || boxName === undefined || x === undefined) {
        return;
    }
    BoxDetails.findOne({
        name: boxName
    }, function (err, data) {
        if (err || !data) {
            return;
        }
        if (typeof thing === 'function') {
            data[x] = data[x].filter(function (item) {
                return !thing(item);
            });
        } else {
            index = data[x].indexOf(thing);
            if (index === -1 || index === data[x].length) {
                return;
            }
            data[x].splice(index, 1);
        }
        data.save();
    });
}


function getXFromBox(boxName, x, callback) {
    'use strict';
    BoxDetails.find({
        name: boxName
    }, function (err, data) {
        if (err || data.length !== 1) {
            callback(null);
        }
        callback(data[0][x]);
    });
}


boxes.getUsers = function (boxName, callback) {
    'use strict';
    getXFromBox(boxName, 'users', callback);
};


boxes.getInvites = function (boxName, callback) {
    'use strict';
    getXFromBox(boxName, 'invites', callback);
};


boxes.getRooms = function (boxName, callback) {
    'use strict';
    getXFromBox(boxName, 'rooms', callback);
};


boxes.getDefaultRoom = function (boxName, callback) {
    'use strict';
    getXFromBox(boxName, 'defaultRoom', callback);
};


boxes.getAll = function (callback) {
    'use strict';
    BoxDetails.find(callback);
};


boxes.getByName = function (boxName, callback) {
    'use strict';
    BoxDetails.findOne({
        name: boxName
    }, function (err, box) {
        if (err || !box) {
            return callback(null);
        }
        callback(box);
    });
};


boxes.addUser = function (user, boxName) {
    'use strict';
    if (typeof user === 'object' && user.username !== undefined) {
        if (boxName === undefined) {
            boxName = user.box;
        }
        user = user.username;
    }
    addXToBox(user, boxName, 'users');

    boxObservable.notifyObservers(boxName);
};


boxes.removeUser = function (user, boxName) {
    'use strict';
    if (typeof user === 'object' && user.username !== undefined) {
        user = user.username;
    }
    removeXFromBox(user, boxName, 'users');

    boxObservable.notifyObservers(boxName);
};


boxes.addInvite = function (invite, boxName) {
    'use strict';
    if (invite.box === undefined && boxName === undefined) {
        return false;
    }
    if (invite.box === undefined) {
        invite.box = boxName;
    }
    if (boxName === undefined) {
        boxName = invite.box;
    }
    if (invite.box !== boxName) {
        return false;
    }
    addXToBox(invite, boxName, 'invites');

    boxObservable.notifyObservers(boxName);
    return true;
};


boxes.removeInvite = function (invite, boxName) {
    'use strict';
    if (boxName === undefined) {
        boxName = invite.box;
    }
    removeXFromBox(function (item) {
        return item.key === invite.key;
    }, boxName, 'invites');

    boxObservable.notifyObservers(boxName);
};



// ~~ USERS ~~ //
var users = {};


function isValidUserObject(user) {
    'use strict';
    if (!user.username || typeof user.username !== 'string') {
        return false;
    }
    if (!user.box || typeof user.box !== 'string') {
        return false;
    }
    if (!user.permissions) {
        return false;
    }
    /* Really no need for account status right now
    if (!user.accountStatus || typeof user.accountStatus !== 'string') {
        return false;
    }
    */
    return true;
}


function modifyUserProperty(query, stuffToSet, successCallback) {
    'use strict';
    if (typeof query === 'string') {
        query = { username: query };
    }
    successCallback = successCallback || function () { return; };
    UserDetails.find(query, function (err, users) {
        if (err || users.length !== 1) {
            successCallback(false);
            return;
        }
        UserDetails.update(query, { $set: stuffToSet }, function (err) {
            if (err) {
                successCallback(false);
                return;
            }
            successCallback(true);
        });
    });
}


users.deleteUser = function (user) {
    'use strict';
    if (user === undefined) {
        return;
    }
    if (typeof user === 'object') {
        user = user.username;
    }

    UserDetails.find({
        username: user
    }, function (err, data) {
        if (err || data.length !== 1) {
            return;
        }
        data = data[0];

        // Remove the user from the box they belonged to
        if (data.box) {
            removeXFromBox(user, data.box, 'users');
        }

        UserDetails.remove({ username: user });
    });
};


users.addUser = function (user) {
    'use strict';
    if (!isValidUserObject(user)) {
        return false;
    }
    UserDetails.create(user);
    return true;
};


users.find = function (user, callback) {
    'use strict';
    if (user === undefined) {
        return;
    }
    if (typeof user === 'object') {
        user = user.username;
    }

    UserDetails.find({
        username: user
    }, function (err, data) {
        if (err || data.length <= 0) {
            callback(null);
            return;
        }
        callback(data[0]);
    });
};


users.findById = function (id, func) {
    'use strict';
    UserDetails.findById(id, func);
};


users.modify = modifyUserProperty;



// ~~ Return Object ~~ //
var retObj = {};

Object.defineProperty(retObj, 'users', {
    get: function () {
        'use strict';
        return users;
    },
    configurable: false
});

Object.defineProperty(retObj, 'boxes', {
    get: function () {
        'use strict';
        return boxes;
    },
    configurable: false
});

Object.defineProperty(retObj, 'mongoose', {
    get: function () {
        'use strict';
        return mongoose;
    }
});

Object.defineProperty(retObj, 'UserDetails', {
    get: function () {
        'use strict';
        return UserDetails;
    }
});


module.exports = retObj;
