// --------------------------------------------------------------------------------------------------------------------
//
// connect-stream-s3.js - Middleware to stream a file to Amazon S3
//
// Copyright (c) 2012 AppsAttic Ltd - http://www.appsattic.com/
// Written by Andrew Chilton <chilts@appsattic.com>
//
// License: http://opensource.org/licenses/MIT
//
// --------------------------------------------------------------------------------------------------------------------

var fs = require('fs');

var async = require('async');
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var s3Service = awssum.load('amazon/s3');

module.exports = function(options) {
    options = options || {};

    // remember these (by taking local variables)
    var accessKeyId     = options.accessKeyId;
    var secretAccessKey = options.secretAccessKey;
    var awsAccountId    = options.awsAccountId;
    var region          = options.region;
    var bucketName      = options.bucketName;
    var concurrency     = options.concurrency || 3;

    // create the S3 API
    var s3 = new s3Service(accessKeyId, secretAccessKey, awsAccountId, region);

    return function handler(req, res, next) {
        // remember what happened to each of these files
        var allOk = true;

        // create an async function to upload the file
        var upload = function(fieldname, callback) {
            // open the file as a read stream
            var bodyStream = fs.createReadStream( req.files[fieldname].path );

            // create the objectName from either what they have already set, or from the uploaded filename
            var objectName = req.files[fieldname].s3ObjectName || req.files[fieldname].name;

            // create the data for s3.PutObject()
            var data = {
                'BucketName'    : bucketName,
                'ObjectName'    : objectName,
                'ContentLength' : req.files[fieldname].size,
                'Body'          : bodyStream,
            };

            s3.PutObject(data, function(err, data) {
                // remember what happened
                req.files[fieldname].s3ObjectName = objectName;
                req.files[fieldname].s3 = {
                    'err'  : err,
                    'data' : data,
                };
                if (err) {
                    allOk = false;
                } // else, everything was ok

                // tell the queue we're finished with this file
                callback();
            });
        }

        // create a queue so we can do all of the uploaded files to S3
        var q = async.queue(upload, concurrency);

        // now, add all of these fields onto the queue
        for(var fieldname in req.files) {
            q.push(fieldname);
        }

        // once the queue is completely empty, call the next middleware
        q.drain = function() {
            if ( allOk ) {
                next();
            }
            else {
                next('One or more of the files failed to upload to S3.');
            }
        };
    };
};

// --------------------------------------------------------------------------------------------------------------------
