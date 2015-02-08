var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');

var InlineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
	this.baseline = 0;
};

util.inherits(InlineBox, ParentBox);

InlineBox.prototype.layout = function(offset, line) {
	this._layoutWidth();
	this._layoutPosition(offset);
	this._layoutChildren(line);
	this._layoutWidth();
	this._layoutHeight();
};

InlineBox.prototype.linePosition = function() {
	return this.position;
};

InlineBox.prototype.lineHeight = function() {
	return this.dimensions.height;
};

InlineBox.prototype._layoutWidth = function() {
	var self = this;
	var style = this.style;

	var iif = function(direction, value) {
		return self[direction + 'Link'] ? 0 : self.toPx(value);
	};

	this.margin.left = iif('left', style['margin-left']);
	this.border.left = iif('left', this.styledBorderWidth('left'));
	this.padding.left = iif('left', style['padding-left']);

	this.margin.right = iif('right', style['margin-right']);
	this.border.right = iif('right', this.styledBorderWidth('right'));
	this.padding.right = iif('right', style['padding-right']);
};

InlineBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;
	var size = this.toPx(style['font-size']);

	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);

	this.baseline = parent.baseline;

	this.position.x = parent.position.x + offset.width + this.leftWidth();
	this.position.y = this.baseline - size + this._textHeight().descent;
};

InlineBox.prototype._layoutChildren = function(line) {
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset, line);
		offset.width += child.width();
	});

	this.dimensions.width = offset.width;
};

InlineBox.prototype._layoutHeight = function() {
	this.dimensions.height = this.toPx(this.style['font-size']);
};

InlineBox.prototype._textHeight = function() {
	var style = this.style;
	return textHeight({
		size: style['font-size'].toString(),
		family: style['font-family'].keyword,
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

module.exports = InlineBox;
