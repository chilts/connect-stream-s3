```
 _______  _______  _        _        _______  _______ _________
(  ____ \(  ___  )( (    /|( (    /|(  ____ \(  ____ \\__   __/
| (    \/| (   ) ||  \  ( ||  \  ( || (    \/| (    \/   ) (   
| |      | |   | ||   \ | ||   \ | || (__    | |         | |   
| |      | |   | || (\ \) || (\ \) ||  __)   | |         | |   
| |      | |   | || | \   || | \   || (      | |         | |   
| (____/\| (___) || )  \  || )  \  || (____/\| (____/\   | |   
(_______/(_______)|/    )_)|/    )_)(_______/(_______/   )_(   
                                                               

            _______ _________ _______  _______  _______  _______ 
           (  ____ \\__   __/(  ____ )(  ____ \(  ___  )(       )
           | (    \/   ) (   | (    )|| (    \/| (   ) || () () |
     _____ | (_____    | |   | (____)|| (__    | (___) || || || |
    (_____)(_____  )   | |   |     __)|  __)   |  ___  || |(_)| |
                 ) |   | |   | (\ (   | (      | (   ) || |   | |
           /\____) |   | |   | ) \ \__| (____/\| )   ( || )   ( |
           \_______)   )_(   |/   \__/(_______/|/     \||/     \|
                                                                 

                _______  ______  
               (  ____ \/ ___  \ 
               | (    \/\/   \  \
         _____ | (_____    ___) /
        (_____)(_____  )  (___ ( 
                     ) |      ) \
               /\____) |/\___/  /
               \_______)\______/ 
                                 
```

Streaming connect middleware for uploading files to Amazon S3.

Uses the awesome [AwsSum](https://github.com/awssum/awssum-amazon-s3/) for Amazon Web Services goodness.

# How to get it #

    $ npm -d install connect-stream-s3

You should get at least v0.6.0 so you get the ability to set extra options. See below.

## Example ##

```
var express = require('express');
var streamS3 = require('../connect-stream-s3');
var amazonS3 = require('awssum-amazon-s3');

// give each uploaded file a unique name (up to you to make sure they are unique, this is an example)
var uniquifyObjectNames = function(req, res, next) {
    for(var key in req.files) {
        req.files[key].s3ObjectName = '' + parseInt(Math.random(100000));
    }
    next();
}

// set up the connect-stream-s3 middleware
var s3StreamMiddleware = streamS3({
    accessKeyId     : process.env.ACCESS_KEY_ID,
    secretAccessKey : process.env.SECRET_ACCESS_KEY,
    awsAccountId    : process.env.AWS_ACCOUNT_ID,
    region          : amazonS3.US_EAST_1,
    bucketName      : process.env.BUCKET_NAME,
    concurrency     : 2,
});

// create the app and paths
var app = module.exports = express.createServer();

app.use(express.bodyParser());

app.post('/upload', uniquifyObjectNames, s3StreamMiddleware, function(req, res, next) {
    for(var key in req.files) {
        console.log('File "' + key + '" uploaded as : ' + req.files[key].s3ObjectName);
    }
    res.redirect('/thanks');
});
```

## Setting Upload Options per File ##

In your middleware which runs after ```bodyParser()``` and prior to ```connect-stream-s3```, you can set a number of
things which will be used in the ```PutObject```.

* s3ObjectName
* s3ObjectCacheControl
* s3ObjectContentEncoding
* s3ObjectStorageClass
* s3ObjectAcl

For example:

```
var myS3Middlware = function(req, res, next) {
    for(var key in req.files) {
        req.files[key].s3ObjectName = '' + parseInt(Math.random(100000));

        // this file as reduced redundancy
        req.files[key].s3StorageClass = 'REDUCED_REDUNDANCY';

        // if this file is an image, cache it for a long time
        if ( req.files[key].name.match(/\.(jpg|png)$/) ) {
            req.files[key].s3CacheControl = 'max-age=864000, must-revalidate';
        }
    }
    next();
}
```

## Setting the Uploaded ObjectName for your Bucket ##

<code>connect-stream-s3</code> looks for an attribute on each of the req.files objects called <code>s3ObjectName</code>
which you *must* set in some middleware *before* the streaming middleware is called. Therefore the order goes (as the
example above shows):

    express.bodyParser();
    uniquifyObjectNames(); // sets s3ObjectName on each uploaded file
    s3StreamMiddleware();

If you *don't* set s3ObjectName on each uploaded file, <code>connect-stream-s3</code> will complain and call next()
with an error, so make sure you set it to values appropriate to your application.

Note: <code>connect-stream-s3</code> originally used the <code>req.files[field].name</code> field as a default but this
really makes no sense at all and has the side-effect that if someone uploads a file with a filename the same as a
previous one, it would get overwritten. I decided that having this as a default was bad, so you are forced to set
s3ObjectName.

# Middleware Options #

## accessKeyId ##

Required.

Specify your Amazon Access Key ID here.

## secretAccessKey ##

Required.

Specify your Amazon Secret Access Key here.

## awsAccountId ##

Required.

Specify your Amazon Account Id here.

## region ##

Required.

Specify which region your bucket is in.

## bucketName ##

Required.

Specify the bucket name to put each file into.

## storageClass ##

Default: 'STANDARD'

If you don't provide the 'storageClass', then your object will be stored as normal using the 'STANDARD' storage
class. If you do, you should set it to 'REDUCED_REDUNDANCY' and your object will be stored as that.

## acl ##

Default: 'private'

Provide the canned Access Control List you want each uploaded file to. e.g. 

Valid values: private | public-read | public-read-write | authenticated-read | bucket-owner-read |
bucket-owner-full-control

(See http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html for the latest list.)

## cacheControl ##

Provide a 'cacheControl' so you can specify caching on the uploaded files.

(See http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html for the latest list.)

## concurrency ##

Default: 3

Shows how many files to upload in parrallel.

# How Does it Work #

<code>connect-stream-s3</code> relies upon <code>express.bodyParser()</code> since it uses the <code>req.files</code>
object. This object already contains pointers to the files on disk and it is these files that are being used when
uploading to Amazon S3.

Many people ask about streaming directly to S3, but I'm probably not going to make this module do this, mainly for the
reason that if the upload to S3 fails, you have no way of retrying. With connect-stream-s3, the file is still on disk
and you can take precautions to retry it.

# Reporting Issues, Bugs or Feature Requests #

Let me know how you get on, whether you like it and if you encounter any problems:

* https://github.com/appsattic/connect-stream-s3/issues

# Author #

Written by: [Andrew Chilton](http://chilts.org/) - [Blog](http://chilts.org/blog/) -
[Twitter](https://twitter.com/andychilton).

## License ##

The MIT License : http://opensource.org/licenses/MIT

Copyright (c) 2012 AppsAttic Ltd. http://appsattic.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(Ends)
