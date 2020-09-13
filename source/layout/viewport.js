var util = require('util');

var values = require('../css/values');
var compute = require('../css/compute');
var Box = require('./box');
var ParentBox = require('./parent-box');
var BlockBox = require('./block-box');

var Length = values.Length;
var Auto = values.Keyword.Auto;

var Viewport = function(position, dimensions) {
	var height = (typeof dimensions.height === 'number') ?
		Length.px(dimensions.height) : Auto;

	Box.call(this, compute({
		width: Length.px(dimensions.width),
		height: height
	}));

	this.position = position;
	this.dimensions = dimensions;
	this.children = [];
};

util.inherits(Viewport, Box);

Viewport.prototype.clone = function() {
	return new Viewport(this.position, this.dimensions);
};

Viewport.prototype.layout = function() {
	var offset = { width: 0, height: 0 };

	this.collapseWhitespace(false);

	this.children.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});

	var dimensions = this.dimensions;
	if(typeof dimensions.height !== 'number') dimensions.height = offset.height;
};

Viewport.prototype.attach = ParentBox.prototype.attach;
Viewport.prototype.detach = ParentBox.prototype.detach;
Viewport.prototype.collapseWhitespace = ParentBox.prototype.collapseWhitespace;
Viewport.prototype.addLink = ParentBox.prototype.addLink;
Viewport.prototype.visibleWidth = ParentBox.prototype.visibleWidth;
Viewport.prototype.visibleHeight = ParentBox.prototype.visibleHeight;
Viewport.prototype.addLine = BlockBox.prototype.addLine;

module.exports = Viewport;
