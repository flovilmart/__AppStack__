var mongoose = require("../controllers/mongo/connect").mongoose();

var Application = mongoose.model('__Application', { name: String, applicationId:{ type: String, index: { unique: true }}, 
	clientKey:String, 
	javascriptKey:String,
	dotNetKey:String,
	webhookKey:String,
	restAPIKey:String, 
	masterKey:String });

module.exports = Application;

var utils = require("../lib/utils");
var Schema = require("./Schema");
Application.create = function()  
{
	var app = new Application();
	app.applicationId = utils.generateAppKeys();
	app.clientKey = utils.generateAppKeys();
	app.javascriptKey = utils.generateAppKeys();
	app.dotNetKey = utils.generateAppKeys();
	app.webhookKey = utils.generateAppKeys();
	app.restAPIKey = utils.generateAppKeys();
	app.masterKey = utils.generateAppKeys();
	return new Promise(function(resolve, reject){
		app.save(function(err, result){
			if (err) {return reject(err);}
			return resolve(app);
		});
	}).then(function(){
		return Schema.createDefaultSchemas(app.applicationId);
	}).then(function(){
		return Promise.resolve(app);
	});
};
