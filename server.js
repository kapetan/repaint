var path = require('path');

var root = require('root');
var send = require('send');

var PORT = process.env.PORT || 10104;

var app = root();

app.get('{*}', function(request, response) {
	send(request, request.params.glob, { root: __dirname })
		.pipe(response);
});

app.listen(PORT, function() {
	console.log('Server listening on port', PORT);
});
