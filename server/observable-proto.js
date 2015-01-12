
function createObservable() {
    'use strict';
    var observers = [],
        oid = 0;

    function addObserver(observer) {
        oid += 1;
        observers.push({
            id: oid,
            cb: observer
        });
    }

    function removeObserver(id) {
        var index;

        for (index = 0; index < observers.length; index += 1) {
            if (observers[index].id === id) {
                observers.splice(index, 1);
            }
        }
    }

    function notifyObservers(message) {
        observers.forEach(function (ob) {
            ob.cb(message);
        });
    }

    return {
        addObserver: addObserver,
        removeObserver: removeObserver,
        notifyObservers: notifyObservers
    };
}

module.exports = createObservable;
