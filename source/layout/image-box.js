var util = require('util');

var Box = require('./box');
var ParentBox = require('./parent-box');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Length = values.Length;

var ImageBox = function(parent, style, image) {
	Box.call(this, style);

	this.parent = parent;
	this.image = image;
};

util.inherits(ImageBox, Box);

ImageBox.prototype.layout = function() {
	var style = this.style;
	var image = this.image;
	var width = style.width;
	var height = style.height;
	var ratio = image.width / image.height;

	var isWidthAuto = Auto.is(width);
	var isHeightAuto = Auto.is(height);

	if(isWidthAuto && isHeightAuto) {
		width = Length.px(image.width);
		height = Length.px(image.height);
	} else if(isWidthAuto) {
		width = Length.px(this.toPx(height) * ratio);
	} else if(isHeightAuto) {
		height = Length.px(this.toPx(width) / ratio);
	}

	this.dimensions.width = this.toPx(width);
	this.dimensions.height = this.toPx(height);

	this.margin.top = this.toPx(style['margin-top']);
	this.margin.bottom = this.toPx(style['margin-bottom']);

	this.border.left = this.toPx(this.styledBorderWidth('left'));
	this.border.right = this.toPx(this.styledBorderWidth('right'));
	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.left = this.toPx(style['padding-left']);
	this.padding.right = this.toPx(style['padding-right']);
	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);
};

ImageBox.prototype.isEmpty =
ImageBox.prototype.isCollapsibleWhitespace = function() {
	return false;
};

ImageBox.prototype.clone = function(parent) {
	var clone = new this.constructor(parent, this.style, this.image);
	if(parent) parent.children.push(clone);

	return clone;
};

ImageBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;
ImageBox.prototype.addLink = ParentBox.prototype.addLink;
ImageBox.prototype.toPx = ParentBox.prototype.toPx;

var InlineImageBox = function(parent, style, image) {
	ImageBox.call(this, parent, style, image);
};

util.inherits(InlineImageBox, ImageBox);

InlineImageBox.prototype.layout = function(offset, line) {
	ImageBox.prototype.layout.call(this);

	var style = this.style;
	var parent = this.parent;

	this.margin.left = this.toPx(style['margin-left']);
	this.margin.right = this.toPx(style['margin-right']);

	this.position.x = parent.position.x + offset.width + this.leftWidth();
	this.position.y = parent.position.y;
};

var BlockImageBox = function(parent, style, image) {
	ImageBox.call(this, parent, style, image);
};

util.inherits(BlockImageBox, ImageBox);

BlockImageBox.prototype.layout = function(offset, line) {
	ImageBox.prototype.layout.call(this);

	this._layoutWidth();
	this._layoutPosition(offset);
};

BlockImageBox.prototype._layoutWidth = function() {
	var self = this;
	var style = this.style;
	var parent = this.parent;

	var marginLeft = style['margin-left'];
	var marginRight = style['margin-right'];

	var total = [
		this.dimensions.width,
		this.padding.left,
		this.padding.right,
		this.border.left,
		this.border.right,
		marginLeft,
		marginRight
	].reduce(function(acc, v) {
		return acc + (typeof v === 'number' ? v : self.toPx(v));
	}, 0);

	var underflow = parent.dimensions.width - total;

	if(underflow < 0) {
		if(Auto.is(marginLeft)) marginLeft = Length.px(0);
		if(Auto.is(marginRight)) marginRight = Length.px(0);
	}

	var isMarginLeftAuto = Auto.is(marginLeft);
	var isMarginRightAuto = Auto.is(marginRight);

	if(!isMarginLeftAuto && !isMarginRightAuto) {
		var margin = this.toPx(marginRight);
		marginRight = Length.px(margin + underflow);
	} else if(!isMarginLeftAuto && isMarginRightAuto) {
		marginRight = Length.px(underflow);
	} else if(isMarginLeftAuto && !isMarginRightAuto) {
		marginLeft = Length.px(underflow);
	} else {
		marginLeft = Length.px(underflow / 2);
		marginRight = Length.px(underflow / 2);
	}

	this.margin.left = this.toPx(marginLeft);
	this.margin.right = this.toPx(marginRight);
};

BlockImageBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;

	this.position.x = parent.position.x + this.leftWidth();
	this.position.y = parent.position.y + offset.height + this.topWidth();
};

ImageBox.Inline = InlineImageBox;
ImageBox.Block = BlockImageBox;

module.exports = ImageBox;
