var url = require('url');

var ElementType = require('domelementtype');
var afterAll = require('after-all');
var xhr = require('xhr');

var Stylesheet = require('./css/stylesheet');

var link = function(base, node, callback) {
	var href = node.attribs.href;
	if(!href) return callback(null, Stylesheet.empty());

	href = url.resolve(base, href);

	xhr({
		method: 'GET',
		url: href
	}, function(err, response, body) {
		var errored = err || !/2\d\d/.test(response.status);
		var stylesheet = errored ? Stylesheet.empty() : Stylesheet.parse(body);

		callback(null, stylesheet);
	});
};

var style = function(node) {
	var text = node.childNodes && node.childNodes[0];
	if(!text || text.type !== ElementType.Text) return Stylesheet.empty();

	return Stylesheet.parse(text.data);
};

module.exports = function(base, nodes, callback) {
	if(!nodes.length) return callback(null, []);

	var stylesheets = new Array(nodes.length);
	var next = afterAll(function(err) {
		callback(err, stylesheets);
	});

	nodes.forEach(function(node, i) {
		var cb = next(function(err, stylesheet) {
			node.stylesheet = stylesheet;
			stylesheets[i] = stylesheet;
		});

		if(node.name === 'link') link(base, node, cb);
		else cb(null, style(node));
	});
};
