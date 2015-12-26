/*
/1/classes/<className>	POST	Creating Objects
/1/classes/<className>/<objectId>	GET	Retrieving Objects
/1/classes/<className>/<objectId>	PUT	Updating Objects
/1/classes/<className>	GET	Queries
/1/classes/<className>/<objectId>	DELETE	Deleting Objects


*/

const ObjectEndpoint = require("./core/ObjectEndpoint");

module.exports = function(req, res, next) {
	const controller = new ObjectEndpoint();
	const app = controller.app();
	console.log(req.params);
	return app(req, res, next);
};

// ClassesController.app = function() {
// 	// var express = require('express');
// 	// var app = express();
// 	// var methods = {};

// 	// app.post("/:className", function(req, res, next){
// 	// 	var className = req.params.className;
// 	// 	var ctrl = new ClassesController(req._AppStack);
// 	// 	ctrl.createObject(className, req.body).then(function(result){
// 	// 		res.status(201);
// 	// 		var location = req.secure ? "https" : "http"
// 	// 		location+="://";
// 	// 		location+=req.get("host")
// 	// 		location+=req.baseUrl+"/"+className
// 	// 		res.location(location+"/"+result.objectId);
// 	// 		res.send( result );
// 	// 	}).catch(function(err){
// 	// 		console.error(err);
// 	// 		res.status(500);
// 	// 		res.send({code: 100, error: "unknown error"});

// 	// 	})
// 	// });

// 	// app.get("/:className/:objectId", function(req, res, next){
// 	// 	var ctrl = new ClassesController(req._AppStack);
// 	// 	return ctrl.getWithId(req.params.className, req.params.objectId)
// 	// 	.then(function(result){
// 	// 		res.send(result);
// 	// 		next();
// 	// 	}).catch(function(err){
// 	// 		if (err.code == 101) {
// 	// 			res.status(404);
// 	// 			res.send(err);
// 	// 		}else {
// 	// 			res.status(500);
// 	// 			res.send(err);
// 	// 		}
// 	// 		next();
// 	// 	})
// 	// });

// 	// app.put("/:className/:objectId", function(req, res, next){
		
// 	// 	var className = req.params.className;
// 	// 	var ctrl = new ClassesController(req._AppStack);
// 	// 	ctrl.updateObject(className, req.params.objectId, req.body).then(function(result){
// 	// 		res.send( result );
// 	// 	}, function(err){
// 	// 		return res.send(err);
// 	// 	});
// 	// });

// 	// app.get("/:className", function(req, res, next){
// 	// 	console.log("PERFORM GET!");
		
// 	// 	// var applicationId = req._AppStack.applicationId;
// 	// 	// var db = req._AppStack.db[applicationId];

// 	// 	var className = req.params.className;
		
// 	// 	var queryOptions = utils.requestToQuery(req);

// 	// 	var ctrl = new QueriesController(className, req._AppStack);
// 	// 	ctrl.find(queryOptions).then(function(result){
// 	// 		if (ctrl.isCount) {
// 	// 			return res.send({results:[], count: result});
// 	// 		};
// 	// 		console.log("Results ", result);
// 	// 		res.send({results: result});
// 	// 	}).catch(function(err){
// 	// 		console.log(err);
// 	// 		res.status(500);
// 	// 		res.send(err);
// 	// 	})

// 	// });

// 	// app.delete("/:className/:objectId", function(req, res, next){
// 	// 	next();
// 	// });
// 	// return app;
// }()