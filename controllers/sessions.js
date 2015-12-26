/*
/1/sessions	POST	Creating Restricted Sessions
/1/sessions/<objectId>	GET	Retrieving Sessions
/1/sessions/me	GET	Retrieving Current Session
/1/sessions/<objectId>	PUT	Updating Sessions
/1/sessions	GET	Querying Sessions
/1/sessions/<objectId>	DELETE	Deleting Sessions
/1/sessions/me	PUT	Pairing with Installation
*/

var ObjectEndpoint = require("./core/ObjectEndpoint");
var SessionController = require("./core/SessionController");
var assert = require('assert');

module.exports = function() {
	var express = require('express');

	var endpoint = new ObjectEndpoint("_Session", SessionController);
	var app = express();
	app.post("/", function(req, res, next){
		return endpoint.handlePost(req, res, next);
	});
	app.get("/:objectId", function(req, res, next){
		return endpoint.handleGetWithId(req, res, next);
	});
	app.get("/me", function(req, res, next){
		assert(false, "Not implementd");
		next();
	});
	app.put("/:objectId", function(req, res, next){
		return endpoint.handlePut(req, res, next);
	});
	app.get("/", function(req, res, next){
		return endpoint.handleGet(req, res, next);
	});
	app.delete("/:objectId", function(req, res, next){
		return endpoint.handleDelete(req, res, next);
	});
	app.put("/me", function(req, res, next){
		assert(false, "Not implementd");
		next();
	});
	return app;
}();