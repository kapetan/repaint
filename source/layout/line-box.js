var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');
var TextBox = require('./text-box');
var ImageBox = require('./image-box');
var LineBreakBox = require('./line-break-box');
var values = require('../css/values');

var LineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
	this.baseline = 0;
};

util.inherits(LineBox, ParentBox);

LineBox.prototype.flatten = function() {
	var descedants = [];
	var flatten = function(parent) {
		descedants.push(parent);
		if(parent.children) parent.children.forEach(flatten);
	};

	this.children.forEach(flatten);
	return descedants;
};

LineBox.prototype.contents = function(breaks) {
	return this.flatten().filter(function(box) {
		return box instanceof TextBox ||
			box instanceof ImageBox ||
			(breaks && box instanceof LineBreakBox);
	});
};

LineBox.prototype.addLine = function(child, branch) {
	ParentBox.prototype.addLine.call(this, child, branch, true);
};

LineBox.prototype.layout = function(offset) {
	var parent = this.parent;

	this.dimensions.width = parent.dimensions.width;

	this.position.x = parent.position.x;
	this.position.y = parent.position.y + offset.height;

	this._layoutStrut();
	this._layoutChildren();
	this._layoutHeight();
};

LineBox.prototype.collapseWhitespace = function() {
	return ParentBox.prototype.collapseWhitespace.call(this, false);
};

LineBox.prototype._layoutStrut = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var height = textHeight({
		size: style['font-size'].toString(),
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});

	this.baseline = this.position.y + size - height.descent;
};

LineBox.prototype._layoutChildren = function() {
	var self = this;
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset, self);
		offset.width += child.width();
	});
};

LineBox.prototype._layoutHeight = function() {
	if(!this.hasContent()) return;

	var minY = this._linePosition();
	var maxY = minY + this._lineHeight();

	var height = function(parent) {
		var position = parent.linePosition();

		minY = Math.min(minY, position.y);
		maxY = Math.max(maxY, position.y + parent.lineHeight());
		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	this.dimensions.height = maxY - minY;
	this.translateChildren(0, this.position.y - minY);
};

LineBox.prototype._linePosition = function() {
	var lineHeight = this._lineHeight();
	var size = this.toPx(this.style['font-size']);
	var leading = (lineHeight - size) / 2;

	return this.position.y - leading;
};

LineBox.prototype._lineHeight = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var lineHeight = style['line-height'];

	return values.Number.is(lineHeight) ?
		lineHeight.number * size : this.toPx(lineHeight);
};

module.exports = LineBox;
