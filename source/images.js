var url = require('url');
var afterAll = require('after-all');

var empty = function(src) {
	return {
		width: 0,
		height: 0,
		src: src,
		complete: false,
		data: null
	};
};

module.exports = function(base, nodes, callback) {
	if(!nodes.length) return callback(null, []);

	var images = new Array(nodes.length);
	var next = afterAll(function(err) {
		callback(err, images);
	});

	nodes.forEach(function(node, i) {
		var src = node.attribs.src;
		var cb = next(function(err, image) {
			image = image || empty(src);

			images[i] = node.image = {
				width: image.width,
				height: image.height,
				src: image.src,
				complete: image.complete,
				data: image
			};
		});

		if(!src) return cb();

		src = url.resolve(base, src);

		var image = new Image();
		image.onload = function() {
			cb(null, image);
		};
		image.onerror = function() {
			cb();
		};

		image.src = src;
	});
};
