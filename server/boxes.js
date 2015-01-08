var auth = require('./auth'),
    roomManager = require('./rooms');


function createBox(boxObj) {
    'use strict';
    var rooms = roomManager(boxObj.rooms);

    function isMember(username) {
        return boxObj.users.indexOf(username) !== -1;
    }

    return {
        isMember: isMember,
        getAllRooms: rooms.getAllRooms
    };
}


auth.getAllBoxes(function (err, boxArray) {
    boxArray.forEach(function (boxObj) {
        boxObj.rooms = roomController(boxObj, auth);
        boxes[boxObj.name] = boxObj;
    });
});


module.exports = function (auth) {
    'use strict';
    var roomController = require('./rooms'),
        boxes = {};




    function bind(socket) {
        var boxName = socket.request.user.box;

        if (boxes[boxName] !== undefined) {
            socket.request.user.box = boxes[boxName];
            boxes[boxName].rooms.bind(socket);
            return true;
        }
        return false;
    }


    function getAllBoxes() {
        return boxes;
    }


    function getAllBoxNames() {
        return Object.keys(boxes);
    }


    return {
        bind: bind,
        getAllBoxes: getAllBoxes,
        getAllBoxNames: getAllBoxNames
    };
};
