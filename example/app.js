var express = require('express');
var connectStreamS3 = require('../connect-stream-s3');
var amazon = require('awssum').load('amazon/amazon');

// ----------------------------------------------------------------------------

// create your express server
var app = module.exports = express.createServer();

var s3StreamMiddleware = connectStreamS3({
    accessKeyId     : process.env.ACCESS_KEY_ID,
    secretAccessKey : process.env.SECRET_ACCESS_KEY,
    awsAccountId    : process.env.AWS_ACCOUNT_ID,
    region          : amazon.US_EAST_1,
    bucketName      : 'pie-18',
    concurrency     : 2,
});

// add the static middleware
app.use(express.static(__dirname + '/htdocs/'));

// for this example, use bodyParser()
app.use(express.bodyParser());

// set up the views
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// ----------------------------------------------------------------------------
// pages

// serve a main page
app.get('/', function(req, res, next) {
    res.render('index', { title: 'Upload a single file (using Express BodyParser())' })
});

app.post('/single-file', s3StreamMiddleware, function(req, res, next) {
    console.log('File should be uploaded by now :', req.files.file_1.s3);
    res.redirect('/thanks');
});

app.post('/multiple-files', s3StreamMiddleware, function(req, res, next) {
    console.log('body', req.body);
    console.log('files', req.files);

    res.redirect('/thanks');
});

app.get('/thanks', function(req, res, next) {
    res.render('thanks', { title: 'Thanks' })
});

app.get('/multiple-file-form', function(req, res, next) {
    res.render('single-form', { title: 'Upload multiple files (using Express BodyParser())' })
});

app.get('/upload', function(req, res, next) {
    next( 'An error has occurred.' );
});

// var streamMiddleware = streamToS3({});
// app.use(streamMiddleware);

// ----------------------------------------------------------------------------

// listen
app.listen(3000);

console.log("Express server listening on port %d in %s mode.", app.address().port, app.settings.env);

// ----------------------------------------------------------------------------
