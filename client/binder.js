/*global define*/

define(['knockout-3.2.0'], function (ko) {
    'use strict';

    function observableArray(domElement) {
        var vm;

        function ViewModel() {
            this.items = ko.observableArray();
        }

        vm = new ViewModel();


        function push(obj) {
            vm.items.push(obj);
        }


        function remove(obj) {
            vm.items.remove(function (item) {
                return item.displayName === obj.displayName;
            });
        }


        function contains(itemOrFunc) {
            var ret = false;

            if (typeof itemOrFunc === 'function') {
                vm.items().forEach(function (item) {
                    if (itemOrFunc(item)) {
                        ret = true;
                    }
                });
            } else if (vm.items().indexOf(itemOrFunc) !== -1) {
                ret = true;
            }

            return ret;
        }


        function set(obj) {
            var alreadyExists = false;

            contains(function (item) {
                if (item.displayName === obj.displayname) {         // FIXME This is probably really bad, but
                    alreadyExists = true;                               // I'm too tired. Figure it out another time
                }                                                       // (Referring to iterating and bool to find item)
            });

            if (alreadyExists) {
                vm.items.replace(function (item) {
                    return item.displayName === obj.displayName;
                }, obj);
            } else {
                push(obj);
            }
        }


        // Only necessary when objects are the values in the array
        function get(func) {
            var ret = null;

            vm.items().forEach(function (item) {
                if (func(item)) {
                    ret = item;
                }
            });

            return ret;
        }


        function removeAll() {
            vm.items.removeAll();
        }


        ko.applyBindings(vm, domElement);

        return {
            push: push,
            remove: remove,
            removeAll: removeAll,
            set: set,
            get: get,
            contains: contains
        };
    }


    // Module constructors
    return {
        observableArray: observableArray
    };
});
