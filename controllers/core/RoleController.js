'use strict';
var _ = require("underscore");
//var utils = require("../../lib/utils");
var ObjectController = require("./ObjectController");
var QueryController = require("./QueriesController");

var Relation = require("../../models/Relation");
class RoleController extends ObjectController {
	constructor(state){
		super("_Role", state);
		this.db.collection("_Role").createIndex( { "name": 1 }, { unique: true, background:true });
		this.db.collection("_Role").createIndex( { "ACL": 1 }, { unique: false, sparse: false  });
	}
	validateObject(object) {
		// Check auth data
		if (_.isUndefined(object.name)) {
			return Promise.reject({code: 100, error: "missing name"}); 
		}
		if (_.isUndefined(object.ACL)) {
			return Promise.reject({code: 100, error: "missing ACL"}); 
		}
		return ObjectController.prototype.validateObject.call(this, object);
	}
	loadRolesForUser(user) {
		var self = this;
		var state = this.state;
		var RoleUsersDbName =  Relation.name("_Role", "_User");
		var userWhere = {"to.objectId": user.objectId, key:"users"};
		var queryController = new QueryController(RoleUsersDbName, state);
		queryController.useMasterKey = true;
		return queryController.find(userWhere).then(function(result){
			if (result.length === 0) {
				return Promise.resolve([]);
			}
			var promises = result.map(function(relation){
				return self.getParentRole(relation.parent);
			});
			promises.push(result);
			return Promise.all(promises);
		}).then(function(results){
			results = _.flatten(results);
			return Promise.resolve(results.map(function(r){ return r.parent.objectId; }));
		});
	}
	getParentRole(role) {
		var self = this;
		var state = this.state;
		var RoleRoleDbName = Relation.name("_Role", "_Role");
		var where = {"to.objectId": role.objectId, key:"roles"};
		var queryController = new QueryController(RoleRoleDbName, state);
		queryController.useMasterKey = true;
		return queryController.find(where).then(function(results){
			var promises = results.map(function(relation){
				return self.getParentRole(relation.parent, state);
			});
			promises.push(results);
			return Promise.all(results);
		});
	}
}

module.exports = RoleController;
