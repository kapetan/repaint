var util = require('util');

var ParentBox = require('./parent-box');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;
var Length = values.Length;

var auto = function(value) {
	return Auto.is(value);
};

var BlockBox = function(parent, style) {
	ParentBox.call(this, parent, style);
};

util.inherits(BlockBox, ParentBox);

BlockBox.prototype.addLine = function(child, branch) {
	var children = this.children;
	var i = children.indexOf(child);

	this.attach(branch, i + 1);
};

BlockBox.prototype.layout = function(offset) {
	this._layoutWidth();
	this._layoutPosition(offset);
	this._layoutChildren();
	this._layoutHeight();
};

BlockBox.prototype._layoutWidth = function() {
	var self = this;
	var parent = this.parent;

	var width = this.style.width;

	var marginLeft = this.style['margin-left'];
	var marginRight = this.style['margin-right'];

	var borderLeft = this.styledBorderWidth('left');
	var borderRight = this.styledBorderWidth('right');

	var paddingLeft = this.style['padding-left'];
	var paddingRight = this.style['padding-right'];

	var total = [
		width,
		marginLeft,
		marginRight,
		borderLeft,
		borderRight,
		paddingLeft,
		paddingRight
	].reduce(function(acc, v) {
		return acc + self.toPx(v);
	}, 0);

	var underflow = parent.dimensions.width - total;

	if(!auto(width) && underflow < 0) {
		if(auto(marginLeft)) marginLeft = Length.px(0);
		if(auto(marginRight)) marginRight = Length.px(0);
	}

	var isWidthAuto = auto(width);
	var isMarginLeftAuto = auto(marginLeft);
	var isMarginRightAuto = auto(marginRight);

	if(!isWidthAuto && !isMarginLeftAuto && !isMarginRightAuto) {
		var margin = this.toPx(marginRight);
		marginRight = Length.px(margin + underflow);
	} else if(!isWidthAuto && !isMarginLeftAuto && isMarginRightAuto) {
		marginRight = Length.px(underflow);
	} else if(!isWidthAuto && isMarginLeftAuto && !isMarginRightAuto) {
		marginLeft = Length.px(underflow);
	} else if(isWidthAuto && !isMarginLeftAuto && !isMarginRightAuto) {
		if(isMarginLeftAuto) marginLeft = Length.px(0);
		if(isMarginRightAuto) marginRight = Length.px(0);

		if(underflow >= 0) {
			width = Length.px(underflow);
		} else {
			var margin = this.toPx(marginRight);

			width = Length.px(0);
			marginRight = Length.px(margin + underflow);
		}
	} else if(!isWidthAuto && isMarginLeftAuto && isMarginRightAuto) {
		marginLeft = Length.px(underflow / 2);
		marginRight = Length.px(underflow / 2);
	}

	this.dimensions.width = this.toPx(width);

	this.margin.left = this.toPx(marginLeft);
	this.margin.right = this.toPx(marginRight);

	this.border.left = this.toPx(borderLeft);
	this.border.right = this.toPx(borderRight);

	this.padding.left = this.toPx(paddingLeft);
	this.padding.right = this.toPx(paddingRight);
};

BlockBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;

	this.margin.top = this.toPx(style['margin-top']);
	this.margin.bottom = this.toPx(style['margin-bottom']);

	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);

	this.position.x = parent.position.x + this.margin.left + this.border.left + this.padding.left;
	this.position.y = parent.position.y + offset.height + this.topWidth();
};

BlockBox.prototype._layoutChildren = function() {
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});

	this.dimensions.height = offset.height;
};

BlockBox.prototype._layoutHeight = function() {
	var parent = this.parent;
	var height = this.style.height;
	var parentHeight = parent.style.height;

	if(Length.is(height)) {
		this.dimensions.height = height.length;
	} else if(Percentage.is(height) && Length.is(parentHeight)) {
		this.dimensions.height = parentHeight.length * height.percentage / 100;
	}
};

module.exports = BlockBox;
