'use strict';
var _ = require("underscore");
//var moment = require("moment");

var mongoose = require("../controllers/mongo/connect").mongoose();
var Mixed = mongoose.Schema.Types.Mixed;

var SchemaSchema = new mongoose.Schema({ 
	className: String, 
	applicationId: String, 
	uniqueName: { type: String, index: { unique: true }}, 
	fields: Mixed
});

var defaultSchema = {
	"objectId": {type: "String"},
	"createdAt": {type:"Date"},
	"updatedAt": {type:"Date"},
	"ACL": {type:"ACL"}
};

var reservedKeys = Object.keys(defaultSchema);

var fieldTypeForObjectValue = function(value) {
	if (!_.isObject(value)) {
		return;
	}
	var type = value.__type;
	var op = value.__op;

	if (_.isUndefined(type) && _.isUndefined(op)) {
		return { type: "Object" };
	}

	if (!_.isUndefined(op)) {

		// {"__op":"Increment","amount":1} -> Number
		// {"__op":"AddUnique","objects":["flying","kungfu"]} -> Array
		// {"__op":"Add","objects":["flying","kungfu"]} -> Array
		// {"__op":"Remove","objects":["flying","kungfu"]} -> Array
		// {"__op":"AddRelation","objects":[] } -> Relation
		// {"__op":"RemoveRelation"} -> Relation

		if (op == "Increment") {
			return {type:"Number"};
		}else if (op == "AddUnique" || op == "Remove" || op == "Add") {
			return {type:"Array"};
		}else if (op == "AddRelation" || op == "RemoveRelation") {
			return { type: "Relation" , targetClass: value.objects[0].className };
		}else{
			console.error("unkown op");
			return;
		}
	} else {
		if (type == "Date") {
			return {type: "Date"};
		}else if(type == "Pointer") {
			return {
				type: "Pointer",
				targetClass: value.className
			};
		}else if(type == "Relation") {
			return {
				type: "Relation",
				targetClass: value.className
			};
		}else if(type == "Bytes") {
			return {
				type: "Bytes"
			};
		}else if(type == "File") {
			return {
				type: "File"
			};
		}
	}
	return;
};

var JSONToFields = function(object) {
	var fields = {};

	for(var key in object) {
		if (reservedKeys.indexOf(key) > -1) {
			continue;
		}
		var value = object[key];
		var fieldType;
		if (_.isObject(value)) {
			
			fieldType = fieldTypeForObjectValue(value, key);
		
		}else if (_.isString(value)) {
			
			fieldType = {type: "String"};
		
		}else if(_.isNumber(value)){
			fieldType = {type: "Number"};
		
		}else if(_.isBoolean(value)) {
			fieldType = {type: "Boolean"};
		
		}else if(_.isArray(value)) {
			fieldType = {type: "Array"};
		}
		console.log("Field Type ", fieldType, key, value);
		if (fieldType) {
			fields[key] = fieldType;
		}else{
			console.log("DOnt know waht it is!");
		}
	}
	return _.defaults(fields, defaultSchema);
};


SchemaSchema.methods.validateWithObject = function(object) {
	//var currentSchema = this;
	var currentFields = this.fields;

	var newFields = JSONToFields(object);
	console.log("New Fields", newFields);
	for(let k in currentFields) {
		if (_.isUndefined(newFields[k]) && currentFields[k].required === true) {
			return {code: 135, error: `${k} must be specified`};
		}
	}

	for(let k in newFields) {
		// TODO: Implement required keys 
		if (!_.isUndefined(currentFields[k]) && newFields[k].type != currentFields[k].type) {
			//invalid type for key workd, expected string, but got number 
			var type = currentFields[k].type.toLowerCase();
			var newtype = newFields[k].type.toLowerCase();
			var error = {code: 111, error: `invalid type for key ${k}, expected ${type}, but got ${newtype}`};
			return error;
			//errors.push({field: k, expectedType: currentFields[k]});
		}
	}
	return false;
};

SchemaSchema.methods.updateFromObject = function(object, fn) {
	var error = this.validateWithObject(object);
	if (!error) {
		var fields = _.defaults(this.fields, JSONToFields(object));
		Schema.update({uniqueName: this.uniqueName}, {fields:fields}, fn);
	}else{
		fn(error);
	}
};

var Schema = mongoose.model('__Schema',SchemaSchema);

module.exports = Schema;

Schema.createFromObject = function(applicationId, className, object, next) {
	var fields = JSONToFields(object);
	return Schema.createWithFields(applicationId, className, fields, next);
};

Schema.createWithFields = function(applicationId, className, fields, next) {
	var schema = new Schema({
		applicationId: applicationId,
		className: className,
		uniqueName: applicationId+className,
		fields: fields
	});
	return new Promise(function(resolve, reject){
		schema.save(function(err, result){
			if (err) { 
				reject(err);
			}else{
				resolve(result);
			}
			if (next) { next(err, result); }
		});
	});
};

Schema.createDefaultSchemas = function(applicationId) {
	var defaultClasses = Object.keys(Schema.defaults);
	return Promise.all(defaultClasses.map(function(cn){
		var fields = Schema.defaults[cn];
		return Schema.createWithFields(applicationId, cn, fields);
	}));
};

Schema.defaults = {};

Schema.defaults._User = _.extend({
	username: {type:'String'},
	email: {type:'String'},
	password: {type:'String'},
	authData: {type: 'Object'},
	emailVerified: {type:'Boolean'},

}, defaultSchema);

Schema.defaults._Installation = _.extend({
	GCMSenderId: {type:'String'},
	appIdentifier: {type:'String'},
	appName: {type:'String'},
	appVersion: {type: 'String'},
	badge: {type:'Number'},
	channels: {type:'Array'},
	deviceToken: {type:'String'},
	deviceType: {type:'String'},
	installationId: {type:'String'},
	localeIdentifier: {type:'String'},
	parseVersion: {type:'String'},
	pushType: {type:'String'},
	timeZone: {type:'String'}
}, defaultSchema);

Schema.defaults._Role = _.extend({
	name: {type:'String', required: true},
	roles: {type:'Relation', targetClass: '_Role'},
	users: {type:'Relation', targetClass: '_User'},	
	ACL: {type:"ACL", required: true }
}, defaultSchema);

Schema.defaults._Session = _.extend({
	createdWith: {type:'Object'},
	expiresAt: {type:'Date'},
	installationId: {type:'String'},
	restricted: {type:"Boolean"},
	sessionToken: {type: "String"},
	user: {type:"User"}	
}, defaultSchema);

Schema.defaults._Product = _.extend({
	download: {type:'File'},
	downloadName: {type:'String'},
	icon: {type:'File', required: true},
	order: {type:"Number", required: true},
	productIdentifier: {type: "String", required: true},
	title: {type:"String", required: true},
	subtitle: {type:"String", required: true},
}, defaultSchema);
