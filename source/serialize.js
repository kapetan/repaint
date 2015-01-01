var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');
var ImageBox = require('./layout/image-box');

var indent = function(i) {
	return (new Array(i + 1)).join('|    ');
};

var name = function(box) {
	if(box instanceof Viewport) return 'Viewport';
	if(box instanceof BlockBox) return 'BlockBox';
	if(box instanceof LineBox) return 'LineBox';
	if(box instanceof InlineBox) return 'InlineBox';
	if(box instanceof TextBox) return 'TextBox';
	if(box instanceof ImageBox.Block) return 'BlockImageBox';
	if(box instanceof ImageBox.Inline) return 'InlineImageBox';
};

var attributes = function(box) {
	return '(' + [
		['x', box.position.x],
		['y', box.position.y],
		['width', box.dimensions.width],
		['height', box.dimensions.height]
	].map(function(pair) {
		return pair[0] + '=' + pair[1];
	}).join(', ') + ')';
};

var toString = function(box, indentation) {
	var space = indent(indentation);

	if(box instanceof TextBox) return [space, name(box), attributes(box), '[', JSON.stringify(box.text), ']'].join('');
	if(box instanceof ImageBox) return [space, name(box), attributes(box), '[', JSON.stringify(box.image.src), ']'].join('');

	var children = box.children
		.map(function(child) {
			return toString(child, indentation + 1);
		}).filter(Boolean);

	return [space + name(box) + attributes(box) + '[']
		.concat(children)
		.concat([space + ']'])
		.join('\n');
};

module.exports = function(box) {
	return toString(box, 0);
};
