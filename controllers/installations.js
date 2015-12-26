/*
/1/installations	POST	Uploading Installation Data
/1/installations/<objectId>	GET	Retrieving Installations
/1/installations/<objectId>	PUT	Updating Installations
/1/installations	GET	Querying Installations
/1/installations/<objectId>	DELETE	Deleting Installations


*/

var ObjectEndpoint = require("./core/ObjectEndpoint");

module.exports = function() {
	var express = require('express');
	var app = express();
	var endpoint = new ObjectEndpoint("_Installation");

	app.post("/", endpoint.POST.bind(endpoint));
	app.get("/:objectId",  endpoint.GET.bind(endpoint));
	app.put("/:objectId", endpoint.PUT.bind(endpoint));
	app.get("/",  endpoint.GET.bind(endpoint));
	app.delete("/:objectId", endpoint.DELETE.bind(endpoint));
	
	return app;
}();