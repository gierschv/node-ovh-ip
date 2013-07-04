var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    config = require('config'),
    express = require('express'),
    routes = require('./routes');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('html', function (path, options, fn) {
  fs.readFile(path, 'utf8', function (err, str) {
    if (err) return fn(err);
    fn(null, str);
  });
});

if ('development' == app.get('env')) {
	app.use(express.logger('dev'));
}
else {
	app.use(express.logger());
}

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.app.sessSecret));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/ip*', routes.ip);
app.put('/ip*', routes.ip);
app.post('/ip*', routes.ip);
app.delete('/ip*', routes.ip);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
