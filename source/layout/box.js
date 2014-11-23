var ElementType = require('domelementtype');

var values = require('../css/values');
// var compute = require('../css/compute');

var None = values.Keyword.None;
// var Block = values.Keyword.Block;
// var Inline = values.Keyword.Inline;
var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;
var Length = values.Length;

var Widths = function() {
	this.top = 0;
	this.right = 0;
	this.bottom = 0;
	this.left = 0;
};

var Box = function(style) {
	// this.parent = parent;
	// this.style = style || compute({}, parent && parent.style);
	this.style = style;

	// this.children = [];
	this.position = { x: 0, y: 0 };
	this.dimensions = { width: 0, height: 0 };

	this.margin = new Widths();
	this.border = new Widths();
	this.padding = new Widths();
};

Box.prototype.topWidth = function() {
	return this.margin.top + this.border.top + this.padding.top;
};

Box.prototype.rightWidth = function() {
	return this.margin.right + this.border.right + this.padding.right;
};

Box.prototype.bottomWidth = function() {
	return this.margin.bottom + this.border.bottom + this.padding.bottom;
};

Box.prototype.leftWidth = function() {
	return this.margin.left + this.border.left + this.padding.left;
};

Box.prototype.innerWidth = function() {
	return this.padding.left + this.dimensions.width + this.padding.right;
};

Box.prototype.innerHeight = function() {
	return this.padding.top + this.dimensions.height + this.padding.bottom;
};

Box.prototype.outerWidth = function() {
	return this.border.left + this.innerWidth() + this.border.right;
};

Box.prototype.outerHeight = function() {
	return this.border.top + this.innerHeight() + this.border.bottom;
};

Box.prototype.width = function() {
	return this.margin.left + this.outerWidth() + this.margin.right;
};

Box.prototype.height = function() {
	return this.margin.top + this.outerHeight() + this.margin.bottom;
};

// Box.prototype.toPx = function(value) {
// 	if(Auto.is(value)) return 0;
// 	if(Percentage.is(value)) {
// 		var width = this.parent.dimensions.width;
// 		return width * value.percentage / 100;
// 	}

// 	return value.length;
// };

Box.prototype.styledBorderWidth = function(direction) {
	var borderWidth = this.style['border-' + direction + '-width'];
	var borderStyle = this.style['border-' + direction + '-style'];

	return None.is(borderStyle) ? Length.px(0) : borderWidth;
};

// Box.prototype.isCollapsibleWhitespace = function() {
// 	return this.children.every(function(child) {
// 		return child.isCollapsibleWhitespace();
// 	});
// };

// Box.prototype.isWhitespace = function() {
// 	return this.children.every(function(child) {
// 		return child.isWhitespace();
// 	});
// };

// Box.prototype.clone = function(parent) {
// 	var clone = new this.constructor(parent, this.style);
// 	parent.children.push(clone);

// 	return clone;
// };

Box.prototype.layout = function() {};
// Box.prototype.draw = function() {};

module.exports = Box;
