/**
 *	Name: users.js
 *	Author: Patrick Grasso
 *	Description: This module has some functions that allow the User{} objects
 *		to be converted for different purposes. The intention of this module
 *		was to simplify global user access, but there is not a ton of need
 *		for that anyway (so far) so this module is relatively simplistic
 *	Dependencies:
 *		io - socket.io object that contains all active client user objects on
 *			it thanks to passport.socketio
 */


module.exports = function (io) {

	// Get all active users and their properties
	function getAll(propertyList) {
		var clients = io.eio.clients,
			userObjects = [],
			userInfo;

		Object.keys(clients).map(function (uid) {
			userInfo = { id: clients[uid].request.user.id };
			propertyList.forEach(function (property) {
				if (property in clients[uid].request.user) {
					userInfo[property] = clients[uid].request.user[property];
				}
			});
			userObjects.push(userInfo);
		});

		return userObjects;
	}

	function toStatusUser(user, stat, verbose) {
		return {
			id: user._id,
			displayName: user.displayName,
			stat: stat || user.stat,
			verbose: verbose || false
		};
	}

	return {
		getAll: getAll,
		toStatusUser: toStatusUser
	};
};
