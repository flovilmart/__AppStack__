'use strict';
var utils = require("../../lib/utils");
var ObjectController = require("./ObjectController");
var QueryController = require("./QueriesController");
var moment = require("moment");

class SessionController extends ObjectController {
	constructor(state){
		super("_Session", state);
		this.db.collection("_Session").createIndex( { "sessionToken": 1 }, { unique: true, background:true });
	}
	createForUser(user, createdWith, restricted) {
		var object = {};
		object.user = {
			type: "Pointer", 
			className: "_User", 
			objectId: user.objectId
		};
		object.sessionToken = utils.generateSessionToken();
		object.createdWith = createdWith;
		object.restricted = restricted || false;
		object.expiresAt = moment().add(1, 'y').toDate();

		console.log(object);
		var self = this;
		return self.createObject(object).then(function(result){
			return Promise.resolve({
				objectId: result.objectId, 
				sessionToken: object.sessionToken,
				createdAt: result.createdAt
			});
		});
	}
	validateObject(object) {
		return ObjectController.prototype.validateObject.call(this, object);
	}
	beforeSave(object) {
		object.ACL = {};
		object.ACL[object.user.objectId] = {"read":true, "write": true};
		return Promise.resolve(object);
	}

	load(token) {
		return SessionController.load(token, this.state);
	}

	static load(token, state) {
		var sessionQuery = new QueryController("_Session", state);
		sessionQuery.useMasterKey = true;
		return sessionQuery.find({sessionToken:token}).then(function(result){
			if (result.length != 1) {
				return Promise.reject({code:"209", error: "invalid session token"});
			}
		});
	}
}



module.exports = SessionController;