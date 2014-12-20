

/*jslint browser: true*/
/*global define, Notification*/

define(function () {
    'use strict';
    var focused,
        mobile,
        defaultIcon = 'http://www.stickylife.com/images/u/3309a092bb1f4047a0b66f1fc48b62f1-800.png';


    function init() {
        focused = true;
        mobile = typeof Notification === 'undefined';

        window.addEventListener('focus', function () {
            focused = true;
        });

        window.addEventListener('blur', function () {
            focused = false;
        });

        if (!mobile) {
            Notification.requestPermission();
        }
    }


    function push(obj) {
        var notif;

        if (!focused && !mobile) {
            notif = new Notification('BoxChat (' + new Date(obj.datetime).toLocaleTimeString() + ')', {
                body: obj.from + ': ' + obj.content,
                icon: obj.icon || defaultIcon,
                tag: 'boxchat'
            });
            setTimeout(notif.close.bind(notif), 5000);
            navigator.vibrate(1000);
        }
        navigator.vibrate(1000);
    }


    return {
        init: init,
        push: push
    };
});
