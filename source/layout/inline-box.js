var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');
var values = require('../css/values');

var Length = values.Length;
var Percentage = values.Percentage;

var InlineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
	this.baseline = 0;
};

util.inherits(InlineBox, ParentBox);

InlineBox.prototype.layout = function(offset, line) {
	this._layoutWidth();
	this._layoutBaseline();
	this._layoutPosition(offset);
	this._layoutHeight();
	this._layoutChildren(line);
	this._layoutWidth();
};

InlineBox.prototype.linePosition = function() {
	var lineHeight = this.lineHeight();
	var size = this.toPx(this.style['font-size']);
	var leading = (lineHeight - size) / 2;

	return {
		x: this.position.x,
		y: this.position.y - leading
	};
};

InlineBox.prototype.lineHeight = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var lineHeight = style['line-height'];

	return values.Number.is(lineHeight) ?
		lineHeight.number * size : this.toPx(lineHeight);
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

InlineBox.prototype._layoutBaseline = function() {
	var parent = this.parent;
	var style = this.style;
	var alignment = this.style['vertical-align'];

	if(Length.is(alignment)) {
		this.baseline = parent.baseline - alignment.length;
	} else if(Percentage.is(alignment)) {
		this.baseline = parent.baseline - (alignment.percentage * this.lineHeight() / 100);
	}  else {
		this.baseline = parent.baseline;
	}
};

InlineBox.prototype._textHeight = function() {
	var style = this.style;
	return textHeight({
		size: style['font-size'].toString(),
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

module.exports = InlineBox;
