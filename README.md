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

# How to get it #

    $ npm -d install connect-stream-s3

## Example ##

```
var express = require('express');
var connectStreamS3 = require('../connect-stream-s3');
var amazon = require('awssum').load('amazon/amazon');

var app = module.exports = express.createServer();

app.use(express.bodyParser());

// give each uploaded file a unique name (up to you to make sure they are unique, this is an example)
var uniquifyObjectNames = function(req, res, next) {
    for(var key in req.files) {
        req.files[key].s3ObjectName = '' + parseInt(Math.random(100000));
    }
}

// set up the connect-stream-s3 middleware
var s3StreamMiddleware = connectStreamS3({
    accessKeyId     : process.env.ACCESS_KEY_ID,
    secretAccessKey : process.env.SECRET_ACCESS_KEY,
    awsAccountId    : process.env.AWS_ACCOUNT_ID,
    region          : amazon.US_EAST_1,
    bucketName      : 'your-bucket-name',
    concurrency     : 2, // number of concurrent uploads to S3 (default: 3)
});

app.post('/upload', uniquifyObjectNames, s3StreamMiddleware, function(req, res, next) {
    console.log('File file_a uploaded as : ' + req.files.file_a.s3ObjectName);
    console.log('File file_b uploaded as : ' + req.files.file_b.s3ObjectName);
    console.log('File file_c uploaded as : ' + req.files.file_c.s3ObjectName);
    res.redirect('/thanks');
});
```

(Ends)
