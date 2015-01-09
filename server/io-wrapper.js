module.exports = function (http) {
    'use strict';
    module.exports = require('socket.io')(http);
    return module.exports;
}
