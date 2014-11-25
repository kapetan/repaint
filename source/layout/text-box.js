var util = require('util');
var textWidth = require('text-width');

var values = require('../css/values');
var collapse = require('./whitespace/collapse');
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

TextBox.prototype.endsWithCollapsibleWhitespace = function() {
	return / $/.test(this.text) && this._isCollapsible();
};

TextBox.prototype.collapseWhitespace = function(strip) {
	var format = this.style['white-space'].keyword;

	this.text = collapse(this.text, {
		format: format,
		strip: strip
	});

	return this;
};

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

TextBox.prototype.isCollapsibleWhitespace = function() {
	return this._isWhitespace() && this._isCollapsible();
};

TextBox.prototype.toPx = ParentBox.prototype.toPx;
TextBox.prototype.detach = ParentBox.prototype.detach;

TextBox.prototype._isCollapsible = function() {
	var format = this.style['white-space'];
	return Normal.is(format) || Nowrap.is(format) || PreLine.is(format);
};

TextBox.prototype._isWhitespace = function() {
	return /^[\t\n\r ]*$/.test(this.text);
};

module.exports = TextBox;
