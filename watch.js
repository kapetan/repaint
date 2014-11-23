var util = require('util');
var path = require('path');
var chokidar = require('chokidar');

var build = require('./build');

var PATHS = [
	path.join(__dirname, 'source'),
	path.join(__dirname, 'assets')
];

var now = function() {
	var date = new Date();
	return util.format('[%s]', date.toUTCString());
};

var error = function(err) {
	if(err) console.error(now(), err.stack);
};

var watch = function() {
	chokidar.watch(PATHS, { persistent: true }).on('change', function() {
		console.log(now(), 'Files changed. Building.');
		build(error);
	});
};

module.exports = function() {
	build(function(err) {
		error(err);
		watch();
	});
};

if(require.main === module) {
	module.exports();
}
