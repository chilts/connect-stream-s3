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

    // create the S3 API
    var s3 = new s3Service(accessKeyId, secretAccessKey, awsAccountId, region);

    return function handler(req, res, next) {
        // ToDo: FOR ALL THE FILES!!!

        // open the file as a read stream
        var bodyStream = fs.createReadStream( req.files.file_1.path );

        var options = {
            BucketName    : 'pie-18',
            ObjectName    : req.files.file_1.name,
            ContentLength : req.files.file_1.size,
            Body          : bodyStream,
        };

        s3.PutObject(options, function(err, data) {
            if (err) {
                next(err);
                return;
            }
            // all ok
            // console.log(data);
            req.files.file_1.s3 = true;
            next();
        });
    };
};

// --------------------------------------------------------------------------------------------------------------------
