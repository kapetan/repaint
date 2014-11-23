var through = require('through2');

var html = require('./html');
var stylesheets = require('./stylesheets');
var css = require('./css');
var images = require('./images');
var layout = require('./layout');
var draw = require('./draw');

var streamify = function(fn) {
	return function() {
		return through.obj(fn);
	};
};

exports.html = streamify(function(page, encoding, callback) {
	html(page.content, function(err, document) {
		page.document = document;
		callback(err, page);
	});
});

exports.stylesheets = streamify(function(page, encoding, callback) {
	stylesheets(page.url, page.document.stylesheets, function(err, stylesheets) {
		page.stylesheets = stylesheets;
		callback(err, page);
	});
});

exports.css = streamify(function(page, encoding, callback) {
	css(page.stylesheets, page.document.html);
	callback(null, page);
});

exports.images = streamify(function(page, encoding, callback) {
	images(page.url, page.document.images, function(err, images) {
		page.images = images;
		callback(err, page);
	});
});

exports.layout = streamify(function(page, encoding, callback) {
	page.layout = layout(page.document.html, page.viewport, page.context);
	callback(null, page);
});

exports.draw = streamify(function(page, encoding, callback) {
	draw(page.layout, page.context);
	callback(null, page);
});
