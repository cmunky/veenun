
var express = require('express');
var app = express();
var path = require('path');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    console.log( '/' );
    res.type('json')
    res.send({ path: '/'})
});

app.get('/git/branch/:name', function(req, res) {
    var git = require('./git-branch.js')
    git.logs(req.params.name, res)
});

app.get('/git/dump', function(req, res) {
    var git = require('./git-branch.js')
    git.all(res)
});

app.get('/git', function(req, res) {
    var git = require('./git-branch.js')
    git.branches(res)
});

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = app.listen(23232, function() {
	console.log('Listening on port %d', server.address().port);
});