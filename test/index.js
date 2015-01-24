var util = require('util');
var fs = require('fs');
var qs = require('querystring');

var serialize = require('./serialize');
var render = require('../');

var query = qs.parse(window.location.search.replace(/^\?/, ''));

var url = function(path) {
	var loc = window.location;
	return util.format('%s//%s/test/assets/%s', loc.protocol, loc.host, path);
};

var assets = {};
assets[url('simple-block.html')] = fs.readFileSync(__dirname + '/assets/simple-block.html', 'utf-8');
assets[url('nested-block.html')] = fs.readFileSync(__dirname + '/assets/nested-block.html', 'utf-8');
assets[url('stack-block.html')] = fs.readFileSync(__dirname + '/assets/stack-block.html', 'utf-8');
assets[url('simple-inline.html')] = fs.readFileSync(__dirname + '/assets/simple-inline.html', 'utf-8');
assets[url('empty-inline.html')] = fs.readFileSync(__dirname + '/assets/empty-inline.html', 'utf-8');
assets[url('nested-inline.html')] = fs.readFileSync(__dirname + '/assets/nested-inline.html', 'utf-8');
assets[url('column-inline.html')] = fs.readFileSync(__dirname + '/assets/column-inline.html', 'utf-8');
assets[url('white-space.html')] = [fs.readFileSync(__dirname + '/assets/white-space.html', 'utf-8'), 512, 768];
assets[url('mixed-white-space.html')] = fs.readFileSync(__dirname + '/assets/mixed-white-space.html', 'utf-8');
assets[url('multiline.html')] = fs.readFileSync(__dirname + '/assets/multiline.html', 'utf-8');
assets[url('br.html')] = fs.readFileSync(__dirname + '/assets/br.html', 'utf-8');
assets[url('block-in-inline.html')] = fs.readFileSync(__dirname + '/assets/block-in-inline.html', 'utf-8');
assets[url('nested-block-in-inline.html')] = fs.readFileSync(__dirname + '/assets/nested-block-in-inline.html', 'utf-8');
assets[url('padded-block-in-inline.html')] = fs.readFileSync(__dirname + '/assets/padded-block-in-inline.html', 'utf-8');
assets[url('padded-inline.html')] = fs.readFileSync(__dirname + '/assets/padded-inline.html', 'utf-8');
assets[url('padded-br.html')] = fs.readFileSync(__dirname + '/assets/padded-br.html', 'utf-8');
assets[url('padded-all.html')] = fs.readFileSync(__dirname + '/assets/padded-all.html', 'utf-8');
assets[url('font-size.html')] = fs.readFileSync(__dirname + '/assets/font-size.html', 'utf-8');
assets[url('image.html')] = fs.readFileSync(__dirname + '/assets/image.html', 'utf-8');
assets[url('inline-image.html')] = fs.readFileSync(__dirname + '/assets/inline-image.html', 'utf-8');
assets[url('block-image.html')] = fs.readFileSync(__dirname + '/assets/block-image.html', 'utf-8');
assets[url('multiline-image.html')] = fs.readFileSync(__dirname + '/assets/multiline-image.html', 'utf-8');

var canvas = function(element, options, callback) {
	var canvas = document.createElement('canvas');
	var dimensions = options.viewport.dimensions;

	canvas.width = dimensions.width;
	canvas.height = dimensions.height;

	element.appendChild(canvas);
	options.context = canvas.getContext('2d');

	render(options, callback);
};

var iframe = function(element, options) {
	var dimensions = options.viewport.dimensions;
	var iframe = document.createElement('iframe');
	element.appendChild(iframe);

	iframe.width = dimensions.width;
	iframe.height = dimensions.height;

	var doc = iframe.contentDocument;

	doc.open();
	doc.write(options.content);
	doc.close();
};

var row = function(element, options) {
	var row = document.createElement('div');
	row.className = 'row clearfix';

	var top = document.createElement('div');
	top.className = 'top';

	var name = options.url.split('/').pop();
	var content = document.createTextNode(name);
	var link = document.createElement('a');
	link.href = window.location.pathname + '?name=' + encodeURIComponent(name);

	link.appendChild(content);
	top.appendChild(link);

	var left = document.createElement('div');
	left.className = 'left-column';

	var right = document.createElement('div');
	right.className = 'right-column';

	row.appendChild(top);
	row.appendChild(left);
	row.appendChild(right);

	element.appendChild(row);

	iframe(right, options);
	canvas(left, options, function(err, page) {
		if(err) throw err;

		console.log('--', page.url);
		console.log(serialize(page.layout));
	});
};

var container = document.getElementById('container');

Object.keys(assets).forEach(function(asset) {
	if(query.name && url(query.name) !== asset) return;

	var data = assets[asset];
	data = Array.isArray(data) ? data : [data, 512, 256];

	row(container, {
		url: asset,
		content: data[0],
		viewport: {
			position: { x: 0, y: 0 },
			dimensions: { width: data[1], height: data[2] }
		}
	});
});
