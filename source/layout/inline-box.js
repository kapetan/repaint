var util = require('util');
var ParentBox = require('./parent-box');

var InlineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
};

util.inherits(InlineBox, ParentBox);

InlineBox.prototype.addLine = function(child) {

};

InlineBox.prototype.layout = function(offset, line) {
	this._layoutWidth();
	this._layoutPosition(offset);
	this._layoutChildren(line);
	this._layoutHeight();
};

InlineBox.prototype._layoutWidth = function() {
	var style = this.style;

	this.margin.left = this.toPx(style['margin-left']);
	this.margin.right = this.toPx(style['margin-right']);

	this.border.left = this.toPx(this.styledBorderWidth('left'));
	this.border.right = this.toPx(this.styledBorderWidth('right'));

	this.padding.left = this.toPx(style['padding-left']);
	this.padding.right = this.toPx(style['padding-right']);
};

InlineBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;

	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);

	this.position.x = parent.position.x + offset.width + this.leftWidth();
	this.position.y = parent.position.y;
};

InlineBox.prototype._layoutChildren = function(line) {
	var self = this;
	var offset = { width: 0, height: 0 };

	this.children.forEach(function(child) {
		child.layout(offset, line);

		self.dimensions.height = Math.max(self.dimensions.height, child.height());
		offset.width += child.width();
	});

	this.dimensions.width = offset.width;
};

InlineBox.prototype._layoutHeight = function() {
	this.dimensions.height = this.toPx(this.style['font-size']);
};

module.exports = InlineBox;
