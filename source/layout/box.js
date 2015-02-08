var ElementType = require('domelementtype');

var values = require('../css/values');

var None = values.Keyword.None;
var Length = values.Length;

var Widths = function() {
	this.top = 0;
	this.right = 0;
	this.bottom = 0;
	this.left = 0;
};

Widths.prototype.some = function() {
	return [
		this.top,
		this.right,
		this.bottom,
		this.left
	].some(function(v) {
		return v !== 0;
	});
};

Widths.prototype.reset = function() {
	this.top =
	this.right =
	this.bottom =
	this.left = 0;
};

var Box = function(style) {
	this.style = style;

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

Box.prototype.translate = function(dx, dy) {
	this.position.x += dx;
	this.position.y += dy;
};

Box.prototype.styledBorderWidth = function(direction) {
	var borderWidth = this.style['border-' + direction + '-width'];
	var borderStyle = this.style['border-' + direction + '-style'];

	return None.is(borderStyle) ? Length.px(0) : borderWidth;
};

module.exports = Box;
