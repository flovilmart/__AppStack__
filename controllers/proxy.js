var _ = require("underscore");
var request = require("request");
var url = require('url');

module.exports = function() {
	var express = require("express");
	var app = express();
	
	
	app.use(function(req, res, next){
		if (_.isUndefined(req.body)) {
			console.log("No body...");
			return next();
		}

		if (_.isUndefined(req.body._method)) {
			return next();
		}
		console.log(req.body._method);
		console.log(req.method);


		if (req.body._method == req.method) {
			console.log("No method swap...");
			return next();
		}
		var _method = req.body._method;
		delete req.body._method;
		var location = req.secure ? "https" : "http";
		location+="://";
		location+=req.get("host");
		console.log("Redirecting "+_method+" to "+location+req.originalUrl);
		
		var qs;
		var body;
		if (_method == "GET" && req.method == "POST") {
			if (_.isObject(req.body)) {
				var keys = Object.keys(req.body);
				qs = {};
				keys.forEach(function(key){
					var value = req.body[key];
					if (_.isObject(req.body[key])) {
						value = JSON.stringify(value);
					}
					qs[key] = value;
				});
			}
		}else{
			body = req.body;
		}

		delete req.headers.host;
		delete req.headers["content-type"];
		delete req.headers["content-length"];
		var options = {method: _method, url: url.parse(location+req.originalUrl) , headers: req.headers};
		if (qs) {
			options.qs = qs;
		}else if(body) {
			options.body = body;
			options.json = true;
		}

		request(options, function(err, remoteResponse, remoteBody) {
	        if (err) { return res.status(500).end('Error'); }
	        res.send(remoteBody);
    	});
	});
	return app;
}();