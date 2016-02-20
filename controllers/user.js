'use strict';
/*
/1/users	POST	Signing Up 
					Linking Users
/1/login	GET	Logging In
/1/logout	POST	Logging Out
/1/users/<objectId>	GET	Retrieving Users
/1/users/me	GET	Validating Session Tokens 
Retrieving Current User
/1/users/<objectId>	PUT	Updating Users 
						Linking Users 
						Verifying Emails
/1/users	GET	Querying Users
/1/users/<objectId>	DELETE	Deleting Users
/1/requestPasswordReset	POST	Requesting A Password Reset
*/

//var _ = require("underscore");
var UserController = require("./core/UserController");
var SessionController = require("./core/SessionController");
var QueriesController = require("./core/QueriesController");

var ObjectEndpoint = require("./core/ObjectEndpoint");

var utils = require("../lib/utils");

class UserEndpoint extends ObjectEndpoint {
	constructor()
	{
		super("_User");
	}

	updateState(req, res, next)
	{
		this.state = req._AppStack;
		this.objectController = new UserController(this.state);
		this.queriesController = new QueriesController(this.className, this.state);
		this.sessionController = new SessionController(this.state);
		next();
	}

	login(req, res)
	{
		var user;
		var ctrl = this.queriesController;
		var sessionController = this.sessionController;
		utils.encrypt(req.query.password).then(function(ePass){
			var query = {
				username: req.query.username,
				password: ePass
			};
			ctrl.useMasterKey = true;
			return ctrl.find(query, {_id: 0, password:0});
		}).then(function(result){
			user = result[0];
			return sessionController.createForUser(user, {"action":"login", "authProvider": "password"});
		}).then(function(sessionResult){
			console.log("Creted Session");
			user.sessionToken = sessionResult.sessionToken;
			res.send( user );
		}).catch(function(err){
			console.error(err);
			res.send(err);
		});
	}

	logout(req, res) {
		var session = req._AppStack.session;
		console.log(session);
		var q = {objectId: session.objectId};
		var ctrl = new QueriesController("_Session", req._AppStack);
		ctrl.delete(q).then(function(){
			res.send(200);
		}).catch(function(err){
			res.send(err);
		});
	}
	requestPasswordReset(req, res) {
		res.send("password reset!");
	}

	GET(req, res) {
		if (req.params.objectId == "me") {
			return this.ME(req, res);
		}
		super.GET(req, res);
	}

	ME(req, res) {
		res.send(req._AppStack.user);
	}

	app(){
		if (!this._app) {
			var express = require('express');
			var app = express();
			app.use(this.updateState.bind(this));
			app.post("/users", this.POST.bind(this));
			app.get("/users", this.GET.bind(this));
			app.get("/login", this.login.bind(this));
			app.post("/logout", this.logout.bind(this));
			app.post("/requestPasswordReset", this.requestPasswordReset.bind(this));
			app.get("/users/me", this.ME.bind(this));
			app.get("/users/:objectId", this.GET.bind(this));
			app.put("/users/:objectId", this.PUT.bind(this));
			app.delete("/users/:objectId", this.DELETE.bind(this));
			this._app = app;
		}
		return this._app;
	}
}

var userEP = new UserEndpoint();
module.exports = function() {
	var app = userEP.app();
	console.log("mounted", app);
	return app;
}();

console.log(UserEndpoint);

// module.exports = function() {

// 	var className = "_User";

// 	var express = require('express');
// 	var app = express();
// 	app.post("/users", function(req, res){
		
// 		var newUser = req.body;
// 		var userCreationResult;
		
// 		//var applicationId = req._AppStack.applicationId;
// 		//var db = req._AppStack.db[applicationId];
// 		var ctrl = new UserController(req._AppStack);
// 		var sessionCtrl = new SessionController(req._AppStack);

// 		ctrl.createObject(newUser).then(function(result){
// 			userCreationResult = result;
// 			res.status(201);
// 			var location = req.secure ? "https" : "http";
// 			location+="://";
// 			location+=req.get("host");
// 			location+=req.baseUrl+"/"+className;
// 			res.location(location+"/"+userCreationResult.objectId);
// 			console.log("Created User");
// 			return sessionCtrl.createForUser(result, {"action":"signup", "authProvider": "password"});
			
// 		}).then(function(sessionResult){
// 			console.log("Creted Session");
// 			res.send( { objectId: userCreationResult.objectId, 
// 					createdAt: userCreationResult.createdAt,
// 					sessionToken: sessionResult.sessionToken } );

// 		}).catch(function(err){

// 			if (err.code == 11000) {
// 				res.status(400);
// 				if (err.message.indexOf("username") > -1) {
// 					return res.send({"code":202,"error":"username "+newUser.username+" already taken"}); 
// 				}

// 				return res.send({"code":203,"error":"email "+newUser.email+" already taken"});
// 			}else if(err.code) {
// 				res.status(400);
// 				return res.send(err);
// 			}
// 			console.error(err);
// 			res.status(500);
// 			res.send({code: 100, error: "unknown error", orignalError: err});
// 		});
// 	});
// 	app.get("/login", function(req, res){
// 		var user;
// 		var ctrl = new QueriesController(className, req._AppStack);
// 		var sessionCtrl = new SessionController(req._AppStack);
// 		utils.encrypt(req.query.password).then(function(ePass){
// 			var query = {
// 				username: req.query.username,
// 				password: ePass
// 			};
			
// 			ctrl.useMasterKey = true;
// 			return ctrl.find(query, {_id: 0, password:0});
// 		}).then(function(result){
// 			user = result[0];
// 			return sessionCtrl.createForUser(user, {"action":"login", "authProvider": "password"});
// 		}).then(function(sessionResult){
// 			console.log("Creted Session");
// 			user.sessionToken = sessionResult.sessionToken;
// 			res.send( user );

// 		}).catch(function(err){
// 			console.error(err);
// 			res.send(err);
// 		});
// 	});
// 	app.post("/logout", function(req, res){
// 		var session = req._AppStack.session;
// 		console.log(session);
// 		var q = {objectId: session.objectId};
// 		var ctrl = new QueriesController("_Session", req._AppStack);
// 		ctrl.delete(q).then(function(){
// 			res.send(200);
// 		}).catch(function(err){
// 			res.send(err);
// 		});

// 	});
// 	app.get("/users/me", function(req, res){
// 		res.send(req._AppStack.user);
// 	});
// 	app.put("/users/:objectId", function(req, res){
// 		var ObjectController = require("./core/Object");
// 		var ctrl = new ObjectController(className, req._AppStack);
// 		ctrl.updateObject(req.params.objectId, req.body).then(function(result){
// 			res.send( { updatedAt: result.updatedAt } );
// 		}, function(){
// 			res.status(404); 
// 			return res.send({"error":"Object not found for updated", "code": 101 });
// 		});
// 	});
// 	app.delete("/users/:objectId", function(req, res, next){
// 		// TODO: implement delete user
// 		next();
// 	});
// 	app.get("/users", function(req, res, next){
// 		next();
// 	});
// 	app.get("/users/:objectId", function(req, res, next){
// 		next();
// 	});
// 	app.post("/requestPasswordReset", function(req, res, next){
// 		next();
// 	});
// 	return app;
// }();