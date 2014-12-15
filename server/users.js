/**
 *	users.js - Manage user objects
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
