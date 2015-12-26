'use strict';
//var _ = require("underscore");
var utils = require("../../lib/utils");
var ObjectController = require("./ObjectController");
var QueriesController = require("./QueriesController");

class ObjectEndpoint {
	constructor(className, objectControllerClass){
		console.log("CAlled! "+className);
		this.className = className;
		this.objectControllerClass = objectControllerClass;
	}

	updateState(req, res, next){
		console.dir(req.params);
		if (!this.className) {
			this.className = req.params.className;
		}
		this.state = req._AppStack;
		if (this.objectControllerClass) {
			this.objectController = new this.objectControllerClass(this.state);
		} else {
			this.objectController = new ObjectController(this.className, this.state);
		}
		this.queriesController = new QueriesController(this.className, this.state);
		next();
	}

	POST(req, res, next)
	{
		var className = this.className;
		this.objectController.createObject(req.body).then(function(result){
			return Promise.resolve({ objectId: result.objectId, createdAt: result.createdAt });
		}).then(function(result){
			res.status(201);
			var location = req.secure ? "https" : "http";
			location+="://";
			location+=req.get("host");
			location+=req.baseUrl+"/"+className;
			res.location(location+"/"+result.objectId);
			res.send( result );
			next();
		}).catch(function(err){
			console.error(err);
			res.status(500);
			if (err) {
				res.send(err);
			} else {
				res.send({code: 100, error: "unknown error"});
			}
			next();
		});
	}

	GET(req, res, next)
	{
		if (req.params.objectId) {
			return this.GET_ID(req, res, next);
		}

		const queryController = this.queriesController;
		var queryOptions = utils.requestToQuery(req);
		queryController.find(queryOptions).then(function(result){
			if (queryController.isCount) {
				return res.send({results:[], count: result});
			}
			res.send({results: result});
			next();
		}).catch(function(err){
			console.log(err);
			res.status(500);
			res.send(err);
			next();
		});
	}
	
	GET_ID(req, res, next)
	{
		this.queriesController.find({objectId: req.params.objectId}).then(function(result){
			if (result.length == 1) {
				return Promise.resolve(result[0]);
			}else {
				return Promise.reject({"error":"Object not found for get", "code": 101 });
			}
		})
		.then(function(result){
			res.send(result);
			next();
		})
		.catch(function(err){
			if (err.code == 101) {
				res.status(404);
				res.send(err);
			}else {
				res.status(500);
				res.send(err);
			}
			next();
		});
	}

	PUT(req, res)
	{
		this.objectController.updateObject(req.params.objectId, req.body).then(function(result){
			return Promise.resolve( { updatedAt: result.updatedAt } );
		})
		.then(function(result){
			res.send( result );
		}, function(err){
			return res.send(err);
		});
	}

	DELETE(req, res, next)
	{
		next();
	}
	app(){

		if (!this._app) {
			let express = require('express');
			let app = express();
			
			let rootURL = "/";
			let objectIdURL = "/:objectId";

			if (!this.className) {
				console.log("no classname");
				rootURL = "/:className";
				objectIdURL = "/:className/:objectId";
			}
			app.use(rootURL, this.updateState.bind(this));
			app.post(rootURL, this.POST.bind(this));
			app.get(rootURL, this.GET.bind(this));
			app.get(objectIdURL, this.GET.bind(this));
			app.put(objectIdURL, this.PUT.bind(this));
			app.delete(objectIdURL, this.DELETE.bind(this));			
			this._app = app;
		}

		return this._app;
	}
}

module.exports = ObjectEndpoint;