var util = require('util');

var values = require('../css/values');
var compute = require('../css/compute');
var Box = require('./box');
var ParentBox = require('./parent-box');
var BlockBox = require('./block-box');

var Length = values.Length;

var Viewport = function(position, dimensions) {
	Box.call(this, compute({
		height: Length.px(dimensions.height),
		width: Length.px(dimensions.width)
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

	this.children.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});
};

Viewport.prototype.attach = ParentBox.prototype.attach;
Viewport.prototype.detach = ParentBox.prototype.detach;
Viewport.prototype.addLine = BlockBox.prototype.addLine;

module.exports = Viewport;
