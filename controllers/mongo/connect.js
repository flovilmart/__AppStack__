'use strict';
var MongoClient = require('mongodb').MongoClient,
   assert = require('assert');

var url = process.env.MONGO_URL || "mongodb://localhost:27017/";

const MConnect = module.exports = {};


MConnect.connect = function(dbName){
	var dbURL = url;
	if (dbName) {
		dbURL = dbURL+dbName;
	}
	return function(req) {
		return new Promise(function(resolve){
			if (!req._AppStack.db[dbName]) {
				MongoClient.connect(dbURL, function(err, db) {
					req._AppStack.db[dbName] = db;
					assert.equal(null, err);
					resolve();
				});
			}else{
				resolve();
			}
		});
		
	};
};

MConnect.closeAll = function(req, res, next) {
	var dbs = req._AppStack.db;
	for(var i in dbs) {
		dbs[i].close();
	}
	next();
};


var mongoose = require('mongoose');
mongoose.connect(url+"__application_data");
MConnect.mongoose = function(){	
	return mongoose;
};