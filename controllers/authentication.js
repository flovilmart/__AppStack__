'use strict';
var _ = require("underscore");

var RoleController = require("./core/RoleController");
var QueryController = require("./core/QueriesController");

var Application = require("../models/Application");
var MongoConnect = require("./mongo/connect");

const XParseEmailHeader = "x-parse-email";
const XParsePasswordHeader = "x-parse-password";
const XParseAppIdHeader = "x-parse-application-id";
const XParseClientKeyHeader = "x-parse-client-api-key";
const XParseRESTKeyHeader = "x-parse-rest-api-key";
const XParseMasterKeyHeader = "x-parse-master-key";
const XParseSessionTokenHeader = "x-parse-session-token";



var Auth = module.exports = {};

Auth.userAuth = function(req, res, next){
	//return next();
	let email = req.get(XParseEmailHeader);
	let password = req.get(XParsePasswordHeader);
	if (_.isUndefined(email) || _.isUndefined(password)) {
		res.sendStatus(401);
	}else{
		// Check user auth
		next();
	}
};



Auth.clientAuth = function(req, res, next){
	const appId = req.get(XParseAppIdHeader) || "12345";
	const key = req.get(XParseClientKeyHeader) || "12345";
	const restKey = req.get(XParseRESTKeyHeader);
	const masterKey = req.get(XParseMasterKeyHeader);

	const sessionToken = req.get(XParseSessionTokenHeader);
	if (_.isUndefined(appId) || _.isUndefined(key)) {
		res.sendStatus(401);
	}else{
		// Check user auth
		Application.findOne({applicationId: appId, clientKey:key, restKey: restKey, masterKey: masterKey}, function (err, application) {
		  if (err) return res.send(401, "Application not found");
		  if (!application) return res.send(401, "Application not found");
		  MongoConnect.connect(appId)(req, res, next).then(function(){
		  	req._AppStack.applicationId = appId;
		  	req._AppStack.application = application;
		  	if (sessionToken) {
		  		var ctrl = new QueryController("_Session", req._AppStack);
		  		ctrl.include(["user"]);
		  		ctrl.useMasterKey = true;
		  		return ctrl.find({sessionToken: sessionToken}).then(function(sessions){
		  			if (sessions.length != 1 ) {
		  				return Promise.reject({code: 209, error: "invalid session token"});
		  			}
		  			req._AppStack.session = sessions[0];
		  			req._AppStack.user = req._AppStack.session.user;
		  			req._AppStack.userId = req._AppStack.user.objectId;
		  			return Promise.resolve();
		  		});
		  	}else{
		  		return Promise.resolve();
		  	}
		  }).then(function(){
		  	if (req._AppStack.user) {
		  		console.log("We have a user");
		  		var rc = new RoleController(req._AppStack);
		  		return rc.loadRolesForUser(req._AppStack.user).then(function(roles){
		  			console.log(roles);
		  			req._AppStack.roles = roles;
		  			return Promise.resolve();
		  		});
		  	}

		  }).then(function(){
		  	next();
		  }).catch(function(err){
		  	console.error("Auth error");
		  	console.error(err);
		  	res.send(err);
		  });
		});

	}
};