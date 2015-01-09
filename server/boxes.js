var auth = require('./auth'),
    roomManager = require('./rooms'),
    boxes = {};


function createBox(boxObj) {
    'use strict';
    var rooms = roomManager(boxObj),
        retObj;

    function isMember(username) {
        return boxObj.users.indexOf(username) !== -1;
    }

    retObj = {
        isMember: isMember,
        getAllRooms: rooms.getAllRooms
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


module.exports = {
    bind: bind,
    loadBoxes: loadBoxes,
    forEach: forEach
};
