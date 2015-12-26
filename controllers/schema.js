/*
/1/schemas/<className>	GET	Fetch Schema
/1/schemas/<className>	POST	Create Schema
/1/schemas/<className>	PUT	Modify Schema
/1/schemas/<className>	DELETE	Delete Schema

*/

module.exports = function() {
	var express = require('express');
	var app = express();
	app.get("/:className", function(req, res, next){
		next();
	});
	app.post("/:className", function(req, res, next){
		next();
	});
	app.put("/:className", function(req, res, next){
		next();
	});
	app.delete("/:className", function(req, res, next){
		next();
	});
	return app;
}();