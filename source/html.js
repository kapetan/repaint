var htmlparser = require('htmlparser2');
var ElementType = require('domelementtype');
var DomHandler = require('domhandler');

module.exports = function(html, callback) {
	var stylesheets = [];
	var scripts = [];
	var images = [];
	var anchors = [];
	var title = null;

	var ondone = function(err, html) {
		if(err) return callback(err);
		callback(null, {
			html: html,
			stylesheets: stylesheets,
			scripts: scripts,
			images: images,
			anchors: anchors,
			title: title
		});
	};

	var handler = new DomHandler(ondone, {
		withDomLvl1: true,
		normalizeWhitespace: false
	}, function(element) {
		if(element.type === ElementType.Script) scripts.push(element);
		if(element.type === ElementType.Style) stylesheets.push(element);
		if(element.type === ElementType.Tag && element.name === 'link' && element.attribs.rel === 'stylesheet') stylesheets.push(element);
		if(element.type === ElementType.Tag && element.name === 'img') images.push(element);
		if(element.type === ElementType.Tag && element.name === 'a') anchors.push(element);
		if(element.type === ElementType.Tag && element.name === 'title') title = element;
	});

	var parser = new htmlparser.Parser(handler);

	parser.write(html);
	parser.done();
};
