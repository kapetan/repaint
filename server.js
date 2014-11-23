var path = require('path');

var root = require('root');
var send = require('send');

var PORT = process.env.PORT || 10104;
var DIST = path.join(__dirname, 'dist');
var ASSETS = path.join(__dirname, 'assets');

var app = root();

app.get('/assets/{*}', function(request, response) {
	send(request, request.params.glob, { root: ASSETS })
		.pipe(response);
});

app.get('{*}', function(request, response) {
	send(request, request.params.glob, { root: DIST })
		.pipe(response);
});

app.listen(PORT, function() {
	console.log('Server listening on port', PORT);
});
