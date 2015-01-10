/*global define*/

define(['knockout-3.2.0'], function (ko) {
    'use strict';

    function observableArray(domElement) {
        var vm, returnObject;

        function ViewModel() {
            this.items = ko.observableArray();
        }

        vm = new ViewModel();


        function push(obj) {
            vm.items.push(obj);
        }


        function remove(func) {
            vm.items.remove(func);
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


        function set(obj, func) {
            var alreadyExists = contains(func);

            if (alreadyExists) {
                vm.items.replace(func, obj);
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

        returnObject = {
            push: push,
            remove: remove,
            removeAll: removeAll,
            set: set,
            get: get,
            contains: contains
        };

        Object.defineProperty(returnObject, 'vm', {
            get: function () {
                return vm;
            }
        });

        return returnObject;
    }


    // Module constructors
    return {
        observableArray: observableArray
    };
});
