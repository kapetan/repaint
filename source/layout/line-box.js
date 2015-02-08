var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');
var TextBox = require('./text-box');
var ImageBox = require('./image-box');
var LineBreakBox = require('./line-break-box');

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
		family: style['font-family'].keyword,
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

	var minY = this.position.y;
	var maxY = this.position.y;

	var height = function(parent) {
		var position = parent.linePosition();

		minY = Math.min(minY, position.y);
		maxY = Math.max(maxY, position.y + parent.lineHeight());
		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	this.dimensions.height = maxY - minY;
	this.translate(0, this.position.y - minY);
};

module.exports = LineBox;
