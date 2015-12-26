/*
/1/files/<fileName>	POST	Uploading Files
*/

var AWS = require('aws-sdk'); 
var uuid = require("uuid");
var getRawBody = require('raw-body');
var typer = require('media-typer');

module.exports = function() {
	var express = require('express');
	var app = express();

	var FILE_SIZE_LIMIT = process.env.MAX_UPLOAD_SIZE || '10mb';
	var BUCKET_NAME = process.env.AWS_S3_BUCKET;

	app.post("/:fileName", function(req, res){
		var s3 = new AWS.S3();
		var fileName = req.params.fileName;
		var s3FileName = uuid()+"/"+uuid()+"-"+fileName;
		var s3URL = "https://s3.amazonaws.com/"+BUCKET_NAME+"/apstk-"+s3FileName;
		getRawBody(req,{
		    length: req.headers['content-length'],
		    limit: FILE_SIZE_LIMIT,
		    encoding: typer.parse(req.headers['content-type']).parameters.charset
		  })
	  	.then(function (buf) {

	  		return new Promise(function(resolve, reject){
	  		 	s3.createBucket({Bucket: BUCKET_NAME}, function(err)  {
	  		 		if (err) { return reject(err); }
					var params = {Bucket: BUCKET_NAME, Key: s3FileName, Body: buf};
					s3.upload(params, function(err, data){
						if (err) { return reject(err); }
						return resolve(data);
				});
			});

	  	}).then(function(){

	  		res.status(201);
	  		res.location(s3URL);
	  		res.send({name: s3FileName, url: s3URL});

	  	}).catch(function(err){

	  		console.error(err);
	  		res.send(err);
	  		
	  	});
	   
	  });
		
	});
	return app;
}();