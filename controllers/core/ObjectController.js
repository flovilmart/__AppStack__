'use strict';

var _ = require("underscore");
var moment = require("moment");

var Schema = require("../../models/Schema");
var Relation = require("../../models/Relation");
var utils = require("../../lib/utils");
var QueryController = require("./QueriesController");

function subqueriesOnCollectionForTargetObjects(collection, targetObjects, isRemove) {
	if (isRemove) {
		return new Promise(function(resolve, reject){
			collection.remove({$or: targetObjects}, function(err, res){
				console.error(err);
				if (err && err.code != 11000) { return reject(err); }
				return resolve(res);
			});
		});
	}else{
		return Promise.all(targetObjects.map(function(object){
			return (function(object){
				return new Promise(function(resolve){
					console.log("Inserting "+object.objectId);
					collection.insert(object, function(err, res){
						console.log(err, res);
						console.log("Inserted! ");
						return resolve();
					});
				});
			}(object));
		}));
	}
}

class ObjectController {
	constructor(className, state){
		this.className = className;
		this.state = state;
		if (state) {
			this.updateWithState(state);
		}
		this.db.collection(className).createIndex( { "objectId": 1 }, { unique: true, background:true });
	}
	updateWithState(state) {
		this.applicationId = state.applicationId;
		this.db = state.db[state.applicationId];
		this.userId = state.userId;
		this.roles = state.roles;
		this.useMasterKey = state.useMasterKey;
	}
	mapRelationObjectsOn(object, key, objects) {
		const className = this.className;
		return objects.map(function(obj){
			return {
				parent: { objectId: object.objectId, className: className, __type:"Pointer" },
				key: key,
				to: obj
			};
		});
	}
	mapToMongo(object) {
		var self = this;
		var query = { $set: {}, $inc: {}, $addToSet: {}, $push: {}, $pullAll: {} };
		var subqueries = [];
		for(var k in object) {
			var value = object[k];
			if (_.isObject(value)) {
				if (value.__op) {
					var op = value.__op;
					console.log(op);
					if(op == "Increment") {
						query.$inc[k] =  value.amount || 1;
					}else if (op == "Add") {
						query.$push[k] = {$each: value.objects};
					}else if (op == "AddUnique") {
						query.$addToSet[k] = {$each: value.objects};
					}else if (op == "Remove") {
						query.$pullAll[k] = value.objects;
					}else if (op == "AddRelation" || op == "RemoveRelation") {
						var isRemove = (op == "RemoveRelation");
						console.log("Add relation "+isRemove);

						var objects = value.objects;
						var externalClassName = objects[0].className;
						var relationClassName = Relation.name(self.className, externalClassName);
						var targetObjects = self.mapRelationObjectsOn(object, k, objects);

						console.log(targetObjects);
						
						var collection = self.db.collection(relationClassName);
						collection.createIndex({parent:1, key:1, to:1}, {unique: true});
						subqueries.push(subqueriesOnCollectionForTargetObjects(collection, targetObjects, isRemove));
					}

				}else if(value.__type && value.__type == "Date") {
					var dateString = value.iso;
					var date = moment(dateString, moment.ISO_8601).toDate();
					query.$set[k] = date;
				}else{
					query.$set[k] = value;
				}
				
			}else{
				query.$set[k] = value;
			}
		}
		for(let l in query) {
			if (Object.keys(query[l]).length === 0) {
				delete query[l];
			}
		}
		return Promise.all(subqueries).then(function(){
			return Promise.resolve(query);
		});
	}

	createObject(object) {
		var self = this;
		//var className = this.className;
		// TODO: Do not create prefixed classes (_User, _Installation,_Role, _Session)
		//var collection = this.db.collection(className);
		// TODO: extract ops
		return this._validate(object).then(function(){

			var now = new Date();
			object.updatedAt = now;
			object.createdAt = now;
			object.objectId = utils.generateId();
			
			return self.beforeSave(object);
		}).then(function(object){
			return self.mapToMongo(object);
		}).then(function(mongoObject){
			console.log("MAPPED!");
			var queryController = new QueryController(self.className, self.state);
			return queryController.insert({objectId: object.objectId}, mongoObject);
		}).then(function(){
			return Promise.resolve({objectId: object.objectId, createdAt: object.createdAt });
		});
	}
	updateObject(objectId, object) {
		var self = this;
		//var className = this.className;
		// TODO: Do not create prefixed classes (_User, _Installation,_Role, _Session)
		//var collection = this.db.collection(className);
		// TODO: extract ops
		return this._validate(object).then(function(){
			var now = new Date();
			object.updatedAt = now;
			object.objectId = objectId;
			return self.beforeSave(object);
		
		}).then(function(object){
			return self.mapToMongo(object);
		}).then(function(mongoObject){

			var queryController = new QueryController(self.className,  self.state);
			return queryController.update({objectId: objectId}, mongoObject);

		}).then(function(){

			return Promise.resolve({updatedAt: object.updatedAt});

		});
	}

	deleteObject(objectId) 
	{
		var self = this;
		var className = this.className;
		var queryController = new QueryController(className,  self.state);
		return queryController.delete({objectId: objectId});

	}
	_validate(object) {
		var self = this;
		return self.validateObject(object).then(function(){
			return self.validateSchema(object);
		});
	}

	validateObject(object) {
		return Promise.resolve(object);
	}

	validateSchema(object) {
		
		var className = this.className;
		var applicationId = this.applicationId;
		var uniqueName = applicationId+className;

		return new Promise(function(resolve, reject){
			var cb = function(err, result) {
				if (err) {
					return reject(err);
				}else{
					return resolve(result);
				}
			};

			Schema.findOne({uniqueName: uniqueName}, function(err, schema){
				if(err) {
					return cb(err);
				}
				if (!schema) {
					Schema.createFromObject(applicationId, className,object, cb);
				}else{
					schema.updateFromObject(object, cb);
				}
			});
		});
	}

	beforeSave(object) {
		return Promise.resolve(object);
	}

	afterSave(object) {
		return Promise.resolve(object);
	}
}

module.exports = ObjectController;

