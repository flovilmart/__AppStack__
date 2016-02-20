'use strict';
var request = require("request");
var _ = require("underscore");

var createRequest = function(options) {
	return new Promise(function(resolve){
		request(options, function(err, remoteResponse, remoteBody){
			console.error(err);
			console.log("Remote body", remoteBody);
			if (_.isObject(remoteBody)) {
				if (remoteBody.error) {
					resolve({error: remoteBody});
				}else{
					resolve({success: remoteBody});
				}
			}else{
				console.log("remote body is not object");
				resolve({error: "malformed object", code: 100});
			}
			
		});
	});
};


module.exports = function() {
	var express = require("express");
	var app = express();

	app.use(function(req, res){
		var requests = req.body.requests;
		var location = req.secure ? "https" : "http";
		location+="://";
		location+=req.get("host");
		var headers = req.headers;
		
		delete headers.host;
		delete headers["content-type"];
		delete headers["content-length"];


		var promises = requests.map(function(request){
			const path = request.path;
			const method = request.method;
			const body = request.body;
			const url = location+path;
			return createRequest({method: method, body:body, json:true, url: url, timeout: 2000, headers: headers});
		});
		// 	// console.log(pArray);
			
		// 	// var reqCopy = req;
		// 	// var resCopy = res;
		// 	// if (endpoint == "classes" && method == "POST") {
		// 	// 	return (function(className, body, state){
		// 	// 		var c = new ClassesController(state);
		// 	// 		console.log("Create object");
		// 	// 		return c.createObject(className, body).then(function(result){
		// 	// 			return Promise.resolve({success: result});
		// 	// 		}, function(err){
		// 	// 			console.error(err);
		// 	// 			if (_.isArray(err)) {
		// 	// 				err = err[0];
		// 	// 			};
		// 	// 			return Promise.resolve({error: err});
		// 	// 		})
		// 	// 	}(className, body, state));				
		// 	// }else if(endpoint == "classes" && method == "PUT" && !_.isUndefined(objectId)) {
		// 	// 	return (function(className, body, state){
		// 	// 		var c = new ClassesController(state);
		// 	// 		console.log("Update object");
		// 	// 		return c.updateObject(className, objectId, body).then(function(result){
		// 	// 			return Promise.resolve({success: result});
		// 	// 		}, function(err){
		// 	// 			console.error(err);
		// 	// 			if (_.isArray(err)) {
		// 	// 				err = err[0];
		// 	// 			};
		// 	// 			return Promise.resolve({error: err});
		// 	// 		})
		// 	// 	}(className, body, state));
		// 	// }else if( endpoint == "classes" && method == "DELETE" && !_.isUndefined(objectId) ){
		// 	// 	return (function(className, body, state){
		// 	// 		var c = new ClassesController(state);
		// 	// 		console.log("Delete object");
		// 	// 		return c.deleteObject(className, objectId).then(function(result){
		// 	// 			return Promise.resolve({success: result});
		// 	// 		}, function(err){
		// 	// 			console.error(err);
		// 	// 			if (_.isArray(err)) {
		// 	// 				err = err[0];
		// 	// 			};
		// 	// 			return Promise.resolve({error: err});
		// 	// 		})
		// 	// 	}(className, body, state));
		// 	// };
		// 	return Promise.resolve({error: {code: 101, error: "object not found for update"}});
		// })

		return Promise.all(promises).then(function(results){
			console.log("All Results", results);
			res.send(results);
		});
	});

	return app;
}();