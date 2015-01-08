

module.exports = function (boxObj, auth) {
    'use strict';
    var allRooms = [];

    boxObj.rooms.forEach(function (roomName) {
        allRooms.push(roomName);
    });

    // Extension for socket object to join a room
    // * this refers to io.socket object *
    function joinRoom(room, callback) {
        var user = this.request.user,
            validRoom = false,
            that = this;

        auth.getAllRooms({
            name: boxObj.name
        }, function (err, rooms) {
            rooms.forEach(function (roomObj) {
                if (roomObj.name === room) {
                    validRoom = true;
                }
            });
            if (!err && validRoom && user.rooms.indexOf(room) === -1) {
                user.rooms.push(room);
                that.join(room);
                auth.update(user, {
                    rooms: user.rooms
                });
                callback();
            } else {
                callback(true);
            }
        });
    }


    // Extension for socket object to leave a room
    // * this refers to io.socket object *
    function leaveRoom(room, callback) {
        var user = this.request.user,
            roomIndex = user.rooms.indexOf(room);

        if (roomIndex !== -1) {
            user.rooms.splice(roomIndex, 1);
            auth.update(user, {
                rooms: user.rooms
            });
            this.leave(room);
            callback();
        } else {
            callback(true);
        }
    }


    // Returns all room names as an array
    function getAllRooms() {
        return allRooms;
    }


    // Binds functions to a socket object
    function bind(socket) {
        socket.joinRoom = joinRoom;
        socket.leaveRoom = leaveRoom;
    }


    return {
        bind: bind,
        getAllRooms: getAllRooms
    };
};
