
/*global define, document*/

define(['binder', 'knockout-3.2.0'], function (binder, ko) {
    'use strict';
    var typingUsers = binder.observableArray(document.getElementById('usersTyping'));

    typingUsers.vm.typingSuffix = ko.computed(function () {
        return (typingUsers.vm.items().length > 1) ? ' is typing...' : ' are typing...';
    });


    function addPerson(displayName) {
        typingUsers.push(displayName);
    }


    function removePerson(displayName) {
        typingUsers.remove(displayName);
    }


    return {
        addPerson: addPerson,
        removePerson: removePerson
    };
});
