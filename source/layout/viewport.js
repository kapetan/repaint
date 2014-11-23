var util = require('util');

var values = require('../css/values');
var compute = require('../css/compute');
var Box = require('../layout/box');

// var Percentage = values.Percentage;
var Length = values.Length;

var Viewport = function(position, dimensions) {
	// this.style = { height: values.Length.px(dimensions.height) };
	// Box.call(this, null);
	Box.call(this, compute({
		height: Length.px(dimensions.height),
		width: Length.px(dimensions.width)
	}));

	this.position = position;
	this.dimensions = dimensions;
	this.children = [];

	// this.children = [];
};

util.inherits(Viewport, Box);

// Viewport.prototype.toPx = function(value) {
// 	if(Percentage.is(value)) return 0;
// 	return Box.prototype.toPx.call(this, value);
// };

Viewport.prototype.layout = function() {
	var offset = { width: 0, height: 0 };

	this.children.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});
};

// Viewport.prototype.draw = function(context) {
// 	this.children.forEach(function(child) {
// 		child.draw(context);
// 	});
// };

module.exports = Viewport;
