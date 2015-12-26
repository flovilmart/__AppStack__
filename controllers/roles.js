/*
/1/roles	POST	Creating Roles
/1/roles/<objectId>	GET	Retrieving Roles
/1/roles/<objectId>	PUT	Updating Roles
/1/roles/<objectId>	DELETE	Deleting Roles

*/

var ObjectEndpoint = require("./core/ObjectEndpoint");
var RoleController = require("./core/RoleController");

module.exports = function() {
	var express = require('express');
	var app = express();
	var endpoint = new ObjectEndpoint("_Role", RoleController);

	app.post("/", endpoint.POST.bind(endpoint));
	app.get("/:objectId",  endpoint.GET.bind(endpoint));
	app.put("/:objectId", endpoint.PUT.bind(endpoint));
	app.delete("/:objectId", endpoint.DELETE.bind(endpoint));

	return app;
}();