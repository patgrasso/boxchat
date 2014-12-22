/**
 *  Name: binder.js
 *  Author: Patrick Grasso
 *  Description: This module provides functions that allow data bindings
 *      between javascript objects and DOM elements so that whenever the
 *      javascript object changes, the DOM element representing that
 *      object will update, eliminating the need to constantly remember
 *      to update the UI after every change to the object.
 *
 *      ~! Right now this only supports a bind between []'s and <ul>'s !~
 *  Dependencies:
 *      Object.observe() - Watches the state of and object and calls the
 *          callback function with the object's changes whenever it does
 *          change.
 *          !!! This is only supported in chrome, so consider just switching
 *              to Knockout.js !!!      
 */

/*jslint browser: true*/
/*global define*/

define(function () {
    'use strict';
    var attachments = [];

    /**
     *  BinderElement (constructor) - A wrapper object for DOM elements
     *      with the ability to modify their contents quickly
     */
    function BinderElement(id) {
        this.element = document.getElementById(id);

        // For <ul>s
        function empty() {
            this.element.innerHTML = '';
        }

        function append(text) {
            var textNode = document.createTextNode(text),
                newListItem = document.createElement('li');
            newListItem.appendChild(textNode);
            this.element.appendChild(newListItem);
        }

        function replaceAll(list, convertFunc) {
            var li,
                ul = document.createElement('ul');

            if (convertFunc !== undefined && arguments.length > 1) {
                list = list.map(convertFunc);
            }

            list.forEach(function (textItem) {
                li = document.createElement('li');
                li.innerText = textItem;
                ul.appendChild(li);
            });

            this.element.innerHTML = ul.innerHTML;
        }

        this.replaceAll = replaceAll;
    }


    // Given an object (right now only working with arrays and <ul>s),
    // this sets up an observer on that object and updates the <ul>
    // specified by elementId. convertFunc, if specified, is a map
    // function that is called on each item in obj, the return value
    // of which will become that <li>s innerText.
    function attach(obj, elementId, convertFunc) {
        var binderElem = new BinderElement(elementId);

        Object.observe(obj, function (changes) {
            // Add dynamic functionality to determine if insert() would be
            // better here rather than replaceAll()
            if (Array.isArray(obj)) {
                binderElem.replaceAll(changes[0].object, convertFunc);
            } else if (typeof obj === 'object') {
                binderElem.replaceAll(Object.keys(changes[0].object), convertFunc);
            }
        });

        attachments.push(binderElem);
    }

    return {
        attach: attach
    };

});
