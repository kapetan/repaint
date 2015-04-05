var events = require('events');
var afterAll = require('after-all');
var extend = require('xtend/mutable');

var html = require('./html');
var stylesheets = require('./stylesheets');
var css = require('./css');
var images = require('./images');
var layout = require('./layout');
var draw = require('./draw');
var Stylesheet = require('./css/stylesheet');

var noop = function() {};

var clone = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};

var defaultStylesheets = function(stylesheets) {
	return (stylesheets || []).map(function(sheet, i) {
		return Stylesheet.parse(sheet, i - stylesheets.length);
	});
};

module.exports = function(options, callback) {
	callback = callback || noop;

	var page = new events.EventEmitter();
	var emit = page.emit.bind(page);
	var ondone = function(err) {
		if(err) {
			emit('fail', err);
			return callback(err);
		}

		emit('ready', page);
		callback(null, page);
	};

	extend(page, options, {
		stylesheets: null,
		viewport: clone(options.viewport)
	});

	var position = options.viewport.position;
	options.viewport.position = extend({ x: 0, y: 0 }, position);

	html(options.content, function(err, document) {
		if(err) return ondone(err);

		page.document = document;
		emit('html', document);

		var next = afterAll(function(err) {
			if(err) return ondone(err);

			var tree = layout(document.html, options.viewport);
			page.layout = tree;
			emit('layout', tree);

			draw(tree, options.context);
			emit('draw');

			ondone();
		});

		images(options.url, document.images, next(function(err, images) {
			page.images = images;
			emit('images', images);
		}));

		stylesheets(options.url, document.stylesheets, next(function(err, stylesheets) {
			stylesheets = defaultStylesheets(options.stylesheets).concat(stylesheets);
			css(stylesheets, document.html);
			page.stylesheets = stylesheets;
			emit('stylesheets', stylesheets);
		}));
	});

	return page;
};
