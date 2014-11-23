var util = require('util');

var ParentBox = require('./parent-box');
var LineBox = require('./line-box');
var InlineBox = require('./inline-box');
var TextBox = require('./text-box');
var values = require('../css/values');
var compute = require('../css/compute');

var Auto = values.Keyword.Auto;
var None = values.Keyword.None;
var Percentage = values.Percentage;
var Length = values.Length;

var px = function(parent, value) {
	if(Auto.is(value)) return 0;
	if(Percentage.is(value)) {
		var width = parent.dimensions.width;
		return width * value.percentage / 100;
	}

	return value.length;
};

var auto = function(value) {
	return Auto.is(value);
};

var borderWidth = function(direction, style) {
	var borderWidth = style['border-' + direction + '-width'];
	var borderStyle = style['border-' + direction + '-style'];

	return None.is(borderStyle) ? Length.px(0) : borderWidth;
};

// var dimensions = function() {
// 	return {
// 		top: 0,
// 		right: 0,
// 		bottom: 0,
// 		left: 0
// 	};
// };

// var BlockBox = function(parent, node, style) {
// 	this.parent = parent;
// 	this.node = node;
// 	this.style = style;

// 	this.children = [];

// 	this.position = { x: 0, y: 0 };
// 	this.dimensions = { width: 0, height: 0 };

// 	this.margin = dimensions();
// 	this.border = dimensions();
// 	this.padding = dimensions();
// };

// BlockBox.prototype.topWidth = function() {
// 	return this.margin.top + this.border.top + this.padding.top;
// };

// BlockBox.prototype.bottomWidth = function() {
// 	return this.margin.bottom + this.border.bottom + this.padding.bottom;
// };

var BlockBox = function(parent, style) {
	ParentBox.call(this, parent, style);
};

util.inherits(BlockBox, ParentBox);

// BlockBox.prototype.attach = function(node, style) {
// 	var box = Box.prototype.attach.call(this, style);
// 	var line = this.children[this.children.length - 1];

// 	if(!box) return;
// 	if(box instanceof InlineBox) {
// 		if(!(line instanceof LineBox)) {
// 			line = new LineBox(this);
// 			this.children.push(line);
// 		}

// 	}

// 	return box;
// };

BlockBox.prototype.layout = function(offset) {
	this._layoutWidth();
	this._layoutPosition(offset);
	this._layoutChildren();
	this._layoutHeight();
};

// BlockBox.prototype.draw = function(context) {
// 	this._drawBackground(context);

// 	this._drawBorderTop(context);
// 	this._drawBorderRight(context);
// 	this._drawBorderBottom(context);
// 	this._drawBorderLeft(context);

// 	this._drawChildren(context);
// };

BlockBox.prototype._layoutWidth = function() {
	var parent = this.parent;

	var width = this.style.width;

	var marginLeft = this.style['margin-left'];
	var marginRight = this.style['margin-right'];

	var borderLeft = borderWidth('left', this.style);
	var borderRight = borderWidth('right', this.style);

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
		return acc + px(parent, v);
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
		var margin = px(parent, marginRight);
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
			var margin = px(parent, marginRight);

			width = Length.px(0);
			marginRight = Length.px(margin + underflow);
		}
	} else if(!isWidthAuto && isMarginLeftAuto && isMarginRightAuto) {
		marginLeft = Length.px(underflow / 2);
		marginRight = Length.px(underflow / 2);
	}

	this.dimensions.width = px(parent, width);

	this.margin.left = px(parent, marginLeft);
	this.margin.right = px(parent, marginRight);

	this.border.left = px(parent, borderLeft);
	this.border.right = px(parent, borderRight);

	this.padding.left = px(parent, paddingLeft);
	this.padding.right = px(parent, paddingRight);
};

BlockBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;

	this.margin.top = px(parent, style['margin-top']);
	this.margin.bottom = px(parent, style['margin-bottom']);

	this.border.top = px(parent, borderWidth('top', this.style));
	this.border.bottom = px(parent, borderWidth('bottom', this.style));

	this.padding.top = px(parent, style['padding-top']);
	this.padding.bottom = px(parent, style['padding-bottom']);

	this.position.x = parent.position.x + this.margin.left + this.border.left + this.padding.left;
	this.position.y = parent.position.y + offset.height + this.topWidth(); //parent.position.y + parent.dimensions.height + this.topWidth();
};

BlockBox.prototype._layoutChildren = function() {
	// var self = this;
	var offset = { width: 0, height: 0 };

	this.children.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height(); //child.topWidth() + child.bottomWidth() + child.dimensions.height;
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

// BlockBox.prototype._drawBackground = function(context) {
// 	var x = this.position.x - this.padding.left;
// 	var y = this.position.y - this.padding.top;
// 	var width = this.padding.left + this.dimensions.width + this.padding.right;
// 	var height = this.padding.top + this.dimensions.height + this.padding.bottom;

// 	context.fillStyle = this.style['background-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// BlockBox.prototype._drawBorderTop = function(context) {
// 	if(!this.border.top) return;

// 	var x = this.position.x - this.padding.left - this.border.left;
// 	var y = this.position.y - this.padding.top - this.border.top;
// 	var width = this.border.left + this.padding.left + this.dimensions.width + this.padding.right + this.border.right;
// 	var height = this.border.top;

// 	context.fillStyle = this.style['border-top-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// BlockBox.prototype._drawBorderRight = function(context) {
// 	if(!this.border.right) return;

// 	var x = this.position.x + this.dimensions.width + this.padding.right;
// 	var y = this.position.y - this.padding.top - this.border.top;
// 	var width = this.border.right;
// 	var height = this.border.top + this.padding.top + this.dimensions.height + this.padding.bottom + this.border.bottom;

// 	context.fillStyle = this.style['border-right-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// BlockBox.prototype._drawBorderBottom = function(context) {
// 	if(!this.border.bottom) return;

// 	var x = this.position.x - this.padding.left - this.border.left;
// 	var y = this.position.y + this.dimensions.height + this.padding.bottom;
// 	var width = this.border.left + this.padding.left + this.dimensions.width + this.padding.right + this.border.right;
// 	var height = this.border.bottom;

// 	context.fillStyle = this.style['border-bottom-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// BlockBox.prototype._drawBorderLeft = function(context) {
// 	if(!this.border.left) return;

// 	var x = this.position.x - this.padding.left - this.border.left;
// 	var y = this.position.y - this.padding.top - this.border.top;
// 	var width = this.border.left;
// 	var height = this.border.top + this.padding.top + this.dimensions.height + this.padding.bottom + this.border.bottom;

// 	context.fillStyle = this.style['border-left-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// BlockBox.prototype._drawChildren = function(context) {
// 	this.children.forEach(function(child) {
// 		child.draw(context);
// 	});
// };

module.exports = BlockBox;
