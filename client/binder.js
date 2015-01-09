/*global define*/

define(['knockout-3.2.0'], function (ko) {
    'use strict';

    function observableArray(domElement) {
        var userVM;

        function UsersViewModel() {
            this.userColl = ko.observableArray();
        }

        userVM = new UsersViewModel();


        function push(userObj) {
            userVM.userColl.push(userObj);
        }


        function remove(userObj) {
            userVM.userColl.remove(function (item) {
                return item.displayName === userObj.displayName;
            });
        }


        function set(userObj) {
            var alreadyExists = false;

            userVM.userColl().forEach(function (item) {
                if (item.displayName === userObj.displayname) {         // FIXME This is probably really bad, but
                    alreadyExists = true;                               // I'm too tired. Figure it out another time
                }                                                       // (Referring to iterating and bool to find item)
            });

            if (alreadyExists) {
                userVM.userColl.replace(function (item) {
                    return item.displayName === userObj.displayName;
                }, userObj);
            } else {
                push(userObj);
            }
        }


        function removeAll() {
            userVM.userColl.removeAll();
        }


        ko.applyBindings(userVM, domElement);

        return {
            push: push,
            remove: remove,
            removeAll: removeAll,
            set: set
        };
    }


    // Module constructors
    return {
        observableArray: observableArray
    };
});
