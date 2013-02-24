var vows = require("vows"),
    assert = require("assert");

var connectStreamS3 = require("./connect-stream-s3");

vows.describe('Connect Stream S3').addBatch({
    'options': {
        topic: function() {
            return connectStreamS3;
        },
        'without accessKeyId': {
            topic: function(obj) {
                return obj();
            },
            'should return an error': function(result) {
                assert.equal(result, 'amazon: accessKeyID is required');
            }
        },
        'without secretAccessKey': {
            topic: function(obj) {
                return obj ({accessKeyId: 'xxxxxx'});
            },
            'should return an error': function(result) {
                assert.equal(result, 'amazon: secretAccessKey is required');
            }
        },
        'without region': {
            topic: function(obj) {
                return obj({
                    accessKeyId: 'xxxxxx',
                    secretAccessKey: 'yyyyyy'
                });
            },
            'should return an error': function(result) {
                assert.equal(result, 'amazon: region is required');
            }
        }
    }
}).addBatch({
    'request': {
        topic: function() {
            middleware = connectStreamS3({
                accessKeyId: 'xxxxxx',
                secretAccessKey: 'yyyyyy',
                region: 'us-east-1'
            });
            return middleware;
        },
        'with no file uploads': {
            topic: function(middleware) {
                return middleware({}, {}, this.callback);
            },
            'should report an error': function(err, result) {
                assert.equal(err, 'Error: no files uploaded.');
            }
        },
        'with no s3ObjectName': {
            topic: function(middleware) {
                req = {
                    files: [
                        {},{}
                    ]
                };
                return middleware(req, {}, this.callback);
            },
            'should report an error': function(err, result) {
                assert.equal(err, 'Error: The s3ObjectName field has not been set on the uploaded file "0".');
            }
        },
        'with no s3ObjectName on second file': {
            topic: function(middleware) {
                req = {
                    files: [
                        {'s3ObjectName': 's3obj'},{}
                    ]
                };
                return middleware(req, {}, this.callback);
            },
            'should report an error': function(err, result) {
                assert.equal(err, 'Error: The s3ObjectName field has not been set on the uploaded file "1".');
            }
        }
    }
}).export(module);
