'use strict';
var _ = require("underscore");
var utils = require("../../lib/utils");
var ObjectController = require("./ObjectController");

class UserController extends ObjectController {
	constructor(state){
		super("_User", state);
		this.db.collection("_User").createIndex( { "email": 1 }, { unique: true, background:true,sparse: true , dropDups: true });
		this.db.collection("_User").createIndex( { "username": 1 }, { unique: true, background:true,sparse: true  });
		this.db.collection("_User").createIndex( { "authData.facebook.id": 1 }, { unique: true, background:true,sparse: true  });
		this.db.collection("_User").createIndex( { "authData.twitter.id": 1 }, { unique: true, background:true,sparse: true  });
		this.db.collection("_User").createIndex( { "authData.anonymous.id": 1 }, { unique: true, background:true,sparse: true  });
	}
	validateObject(object) {
		// Check auth data
		if (!_.isUndefined(object.authData)) {
			var authData = object.authData;
			var err = true;
			if (!_.isUndefined(authData.facebook)) {
				// TODO: add validation
				err = false;
			}else if(!_.isUndefined(authData.twitter)) {
				// TODO: add validation
				err = false;
			}else if(!_.isUndefined(authData.anonymous)) {
				// TODO: add validation
				err = false;
			}

			if (err) {
				return Promise.reject({code: 252, error: "unsupported service"}); 
			}


		}else if (_.isUndefined(object.password)) {
			return Promise.reject({code: 201, error: "missing user password"});
		} else if (_.isUndefined(object.username)) {
			return Promise.reject({code: 200, error: "missing username"});
		}
		return ObjectController.prototype.validateObject.call(this, object);
	}
	beforeSave(object) {
		object.ACL = {};
		object.ACL[object.objectId] = {"read":true, "write": true};
		object.ACL["*"] = {"read": true};
		return utils.encrypt(object.password).then(function(hexPass){
			object.password = hexPass;
			console.log("DONE WITH PAWSS");
			return Promise.resolve(object);
		});
	}
}

module.exports = UserController;