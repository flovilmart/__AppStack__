'use strict';
const _ = require("underscore");

const Utils = module.exports = {};

const IDLength = 10;

function genString(count) {
	count = count || IDLength;
	const chars = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
				"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
				"0","1","2","3","4","5","6","7","8","9"];

	var result = "";
	while(result.length < count) {
		result+=chars[Math.floor(Math.random()*chars.length)];
	}
	return result;
}

Utils.generateId = function() {
	return genString(10);
};

Utils.generateSessionToken = function() {
	return "r:"+genString(25);
};

Utils.generateAppKeys = function() {
	return genString(40);
};

Utils.encrypt = function(password) {
	return new Promise(function(resolve, reject){
		require("crypto").pbkdf2(password, process.env.PBKDF2_SALT || "process.env.PBKDF2_SALT", 4096, 512, 'sha256', function(err, key){
			if (err) { return reject(err); }
			return resolve(key.toString('hex'));
		});
	});
};

Utils.requestToQuery = function(req) {
	let query = {};
	console.log(req.query);
	if (req.query.where) {
		if (_.isString(req.query.where)) {
			query = JSON.parse(req.query.where);
		}else{
			query = req.query.where;
		}
	}

	const includeObjects = [];
	if (req.query.include) {
		includeObjects.push(req.query.include);
	}
	let sort, projection, limit, skip;
	if (req.query.order) {
		sort = {};
		req.query.order.split(",").forEach(function(s){
			if (s[0] == "-") {
				sort[s.slice(1, s.length)] = -1;
			}else{
				sort[s] = 1;
			}
		});
	}

	if (req.query.keys) {
		projection = {};
		req.query.keys.split(",").forEach(function(s){
			projection[s] = 1;
		});
	}
	
	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.skip) {
		skip = parseInt(req.query.skip);
	}

	return {
		query: query, 
		sort:sort,
		projection: projection,
		include: includeObjects,
		limit: limit,
		skip: skip,
		count: parseInt(req.query.count) === 1
	};
};