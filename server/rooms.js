

module.exports = function (io, auth) {
    'use strict';


    // Extension for socket object to join a room
    // * this refers to io.socket object *
    function joinRoom(room, callback) {
        var user = this.request.user,
            validRoom = false,
            that = this;

        auth.getAllRooms(function (err, rooms) {
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


    // Binds functions to a socket object
    function bind(socket) {
        socket.joinRoom = joinRoom;
        socket.leaveRoom = leaveRoom;
    }


    return {
        bind: bind
    };
};
