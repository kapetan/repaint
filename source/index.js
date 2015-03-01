var afterAll = require('after-all');

var html = require('./html');
var stylesheets = require('./stylesheets');
var css = require('./css');
var images = require('./images');
var layout = require('./layout');
var draw = require('./draw');

var noop = function() {};

module.exports = function(page, callback) {
	callback = callback || noop;

	html(page.content, function(err, document) {
		if(err) return callback(err);

		var next = afterAll(function(err) {
			if(err) return callback(err);

			var tree = layout(document.html, page.viewport);
			draw(tree, page.context);

			page.document = document;
			page.layout = tree;

			callback(null, page);
		});

		images(page.url, document.images, next(function(err, images) {
			page.images = images;
		}));

		stylesheets(page.url, document.stylesheets, next(function(err, stylesheets) {
			css(stylesheets, document.html);
			page.stylesheets = stylesheets;
		}));
	});
};
