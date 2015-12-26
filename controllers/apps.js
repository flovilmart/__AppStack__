'use strict';
/*
/1/apps/	GET	Fetch Apps
/1/apps/<applicationId>	GET	Fetch App
/1/apps/<applicationId>	POST Create App
/1/apps/<applicationId>	PUT	Modify App

*/

var Application = require("../models/Application.js");

module.exports = function() {
	var express = require('express');
	var app = express();
	app.get("/", function(req, res, next){
		console.log("APPP");
		next();
	});
	app.get("/:applicationId", function(req, res){
		Application.findOne(req.params.applicationId, function(err, application){
			res.send(application);
		});
	});
	app.post("/", function(req, res){
		Application.create().then(function(app){
			res.send(app);
		}).catch(function(err){
			res.send(err);
		});
	});
	app.put("/:applicationId", function(req, res, next){
		next();
	});
	// app.use(function(req, res, next){
	// 	res.send("not implemented");
	// });
	return app;
}();