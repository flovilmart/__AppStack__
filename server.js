global.Promise = require("promise");
//var _ = require("underscore");
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use(function(req, res, next){
	var contentType = req.get("content-type");
	if (contentType) {
		req.headers["content-type"] = contentType.replace("utf8", "utf-8");
	}
	next();
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var authentication = require("./controllers/authentication");

var appV1 = express();



appV1.use(function(req, res, next){
	req._AppStack = {db:{}, stats: {start: new Date() }};
	next();
});


appV1.use(authentication.clientAuth);

// Proxy for disguised GETs in POSTs
appV1.use(require("./controllers/proxy"));

// Batch endpoint
appV1.use("/batch", require("./controllers/batch"));

// All User related enpoints
appV1.use(require("./controllers/user"));

// All Classes related endpoints
appV1.use("/classes", require("./controllers/classes"));

// Installations
appV1.use("/installations", require("./controllers/installations"));

// Roles
appV1.use("/roles", require("./controllers/roles"));

// Schema
appV1.use("/schema", require("./controllers/schema"));

// Files
appV1.use("/files", require("./controllers/files"));

// Event tracking // does nothing
appV1.use("/events", function(req, res){
	res.send({});
});

appV1.use(function(req){
	var startTime = req._AppStack.stats.start.getTime();
	var endTime = new Date().getTime();
	console.log("Processed!", endTime - startTime);
});

var admin = express();

admin.use(authentication.userAuth);
admin.use("/apps", require("./controllers/apps"));

appV1.use(admin);

app.use("/1", appV1);

app.listen(process.env.PORT || 5000);

var Application = require("./models/Application");
var app = new Application({applicationId: "12345", clientKey: "12345"});
app.save();