// var fs = require('fs');
// var util = require('util');

var through = require('through2');
var tuple = require('tuple-stream');
var duplexify = require('duplexify');

var pipeline = require('./pipeline');
// var serialize = require('./serialize');

// var html = require('./html');
// var css = require('./css');
// var stylesheets = require('./stylesheets');
// var images = require('./images');

// html(example2html, function(err, document) {
// 	if(err) throw err;
// 	console.log('-- document', document);

// 	stylesheets(example2url, document.stylesheets, function(err, stylesheets) {
// 		console.log('-- stylesheets', err, stylesheets);
// 	});

// 	images(example2url, document.images, function(err, images) {
// 		console.log('-- images', err, images);
// 	});
// });

//                              -> [stylesheets] -> stylesheets -> [css] -> styled
//                            /                                                    \
// page -> [html] -> document                                                        -> [layout] -> layout -> [renderer] -> drawing
//                            \                                                    /
//                              ->          [images] -> images

module.exports = function() {
	// var input = through.obj(function(page, encoding, callback) {
	// 	html(page.content, function(err, document) {
	// 		page.document = document;
	// 		callback(err, page);
	// 	});
	// });

	// var styling = input
	// 	.pipe(through.obj(function(page, encoding, callback) {
	// 		stylesheets(page.url, page.document.stylesheets, function(err, stylesheets) {
	// 			page.stylesheets = stylesheets;
	// 			callback(err, page);
	// 		});
	// 	}))
	// 	.pipe(through.obj(function(page, encoding, callback) {
	// 		css(page.stylesheets, page.document.html);
	// 		callback(null, page);
	// 	}));

	// var imaging = input.pipe(through.obj(function(page, encoding, callback) {
	// 	images(page.url, page.document.images, function(err, images) {
	// 		page.images = images;
	// 		callback(null, page);
	// 	});
	// }));

	// var output = tuple(styling, imaging)
	// 	.pipe(through.obj(function(pair, encoding, callback) {
	// 		var page = pair[0];
	// 		callback(null, page);
	// 	}));

	// return duplexify.obj(input, output);

	var input = pipeline.html();

	var imaging = input
		.pipe(pipeline.images());

	var styling = input
		.pipe(pipeline.stylesheets())
		.pipe(pipeline.css());

	var merge = through.obj(function(pair, encoding, callback) {
		var page = pair[0];
		callback(null, page);
	});

	var output = tuple(styling, imaging)
		.pipe(merge)
		.pipe(pipeline.layout())
		.pipe(pipeline.draw());

	return duplexify.obj(input, output);
};


// var example2html = fs.readFileSync(__dirname + '/../assets/example2.html', 'utf-8');
// var example2url = util.format('%s//%s/assets/example2.html', window.location.protocol, window.location.host);

// var context3 = document.getElementById('canvas-1').getContext('2d');
// var example3html = fs.readFileSync(__dirname + '/../assets/example3.html', 'utf-8');
// var example3url = util.format('%s//%s/assets/example3.html', window.location.protocol, window.location.host);

// var context4 = document.getElementById('canvas-2').getContext('2d');
// var example4html = fs.readFileSync(__dirname + '/../assets/example4.html', 'utf-8');
// var example4url = util.format('%s//%s/assets/example4.html', window.location.protocol, window.location.host);

// var context5 = document.getElementById('canvas-3').getContext('2d');
// var example5html = fs.readFileSync(__dirname + '/../assets/example5.html', 'utf-8');
// var example5url = util.format('%s//%s/assets/example5.html', window.location.protocol, window.location.host);

// var context6 = document.getElementById('canvas-4').getContext('2d');
// var example6html = fs.readFileSync(__dirname + '/../assets/example6.html', 'utf-8');
// var example6url = util.format('%s//%s/assets/example6.html', window.location.protocol, window.location.host);

// var context7 = document.getElementById('canvas-5').getContext('2d');
// var example7html = fs.readFileSync(__dirname + '/../assets/example7.html', 'utf-8');
// var example7url = util.format('%s//%s/assets/example7.html', window.location.protocol, window.location.host);

// var canvas = document.getElementById('canvas');
// var context = canvas.getContext('2d');

// var stream = module.exports();

// stream.on('data', function(page) {
	// console.log('--', window.p = page);
	// console.log(serialize(page.document.html).join('\n'));

// 	console.log(window.page = page);

// 	console.log(serialize(page.layout));
// });

// stream.write({
// 	content: example3html,
// 	url: example3url,
// 	context: context3,
// 	viewport: {
// 		position: { x: 0, y: 0 },
// 		dimensions: { width: 1024, height: 500 }
// 	}
// });

// stream.write({
// 	content: example4html,
// 	url: example4url,
// 	context: context4,
// 	viewport: {
// 		position: { x: 0, y: 0 },
// 		dimensions: { width: 1024, height: 500 }
// 	}
// });

// stream.write({
// 	content: example5html,
// 	url: example5url,
// 	context: context5,
// 	viewport: {
// 		position: { x: 0, y: 0 },
// 		dimensions: { width: 1024, height: 500 }
// 	}
// });

// stream.write({
// 	content: example6html,
// 	url: example6url,
// 	context: context6,
// 	viewport: {
// 		position: { x: 0, y: 0 },
// 		dimensions: { width: 1024, height: 700 }
// 	}
// });

// stream.write({
// 	content: example7html,
// 	url: example7url,
// 	context: context7,
// 	viewport: {
// 		position: { x: 0, y: 0 },
// 		dimensions: { width: 1024, height: 500 }
// 	}
// });

// stream.end();
