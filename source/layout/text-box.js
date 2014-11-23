var util = require('util');
var textWidth = require('text-width');

var values = require('../css/values');
var Box = require('./box');
var ParentBox = require('./parent-box');

var Normal = values.Keyword.Normal;
var Nowrap = values.Keyword.Nowrap;
var PreLine = values.Keyword.PreLine;

var TextBox = function(parent, text) {
	Box.call(this, parent.style);
	this.parent = parent;
	this.text = text;
};

util.inherits(TextBox, Box);

TextBox.prototype.layout = function(offset) {
	var parent = this.parent;
	var style = this.style;

	if(this.text) this.dimensions.height = this.toPx(style['font-size']);
	this.dimensions.width = textWidth(this.text, {
		size: this.dimensions.height,
		family: style['font-family']
	});

	this.position.x = parent.position.x + offset.width;
	this.position.y = parent.position.y;
};

TextBox.prototype.toPx = ParentBox.prototype.toPx;
TextBox.prototype.detach = ParentBox.prototype.detach;

TextBox.prototype.isCollapsibleWhitespace = function() {
	var format = this.style['white-space'];
	return this.isWhitespace() && (Normal.is(format) || Nowrap.is(format) || PreLine.is(format));
};

TextBox.prototype.isWhitespace = function() {
	return /^[\t\n\r ]*$/.test(this.text);
};

module.exports = TextBox;
