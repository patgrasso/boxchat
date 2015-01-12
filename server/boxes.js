var auth = require('./auth'),
    database = require('./database'),
    roomManager = require('./rooms'),
    boxes = {},
    databaseSubscriptionId;


function createBox(boxObj) {
    'use strict';
    var rooms = roomManager(boxObj),
        retObj;

    function isMember(username) {
        return boxObj.users.indexOf(username) !== -1;
    }

    function updateBox() {
        database.boxes.getByName(boxObj.name, function (box) {
            boxObj.users = box.users;
            boxObj.invites = box.invites;
            boxObj.defaultRoom = box.defaultRoom;
            boxObj.plugins = box.plugins;
        });
        rooms.updateRooms();
    }

    retObj = {
        isMember: isMember,
        getAllRooms: rooms.getAllRooms,
        updateBox: updateBox
    };

    Object.defineProperty(retObj, 'name', {
        get: function () {
            return boxObj.name;
        }
    });

    Object.defineProperty(retObj, 'rooms', {
        get: function () {
            return rooms;
        }
    });

    return retObj;
}


function loadBoxes(callback) {
    'use strict';
    var cbArray = [];

    auth.getAllBoxes(function (err, boxArray) {
        boxArray.forEach(function (boxObj) {
            boxes[boxObj.name] = createBox(boxObj);
            cbArray.push(boxes[boxObj.name]);
        });
        console.log(boxes);                             // FIXME remove
        callback(cbArray);
    });
}


function forEach(func) {
    'use strict';
    Object.keys(boxes).forEach(function (boxName) {
        func(boxes[boxName]);
    });
}


function bind(socket, box) {
    'use strict';
    if (boxes[box.name] !== undefined) {
        boxes[box.name].rooms.bind(socket);
        return true;
    }
    return false;
}


databaseSubscriptionId = database.boxes.subscribe(function (boxName) {
    'use strict';
    boxes[boxName].updateBox();
});


module.exports = {
    bind: bind,
    loadBoxes: loadBoxes,
    forEach: forEach
};
