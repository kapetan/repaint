var util = require('util');
var textWidth = require('text-width');

var values = require('../css/values');
var collapse = require('./whitespace/collapse');
var Box = require('./box');
var ParentBox = require('./parent-box');

var Normal = values.Keyword.Normal;
var Nowrap = values.Keyword.Nowrap;
var PreLine = values.Keyword.PreLine;

var TAB = '        ';

var TextBox = function(parent, text) {
	Box.call(this, parent.style);
	this.parent = parent;
	this.text = text;
};

util.inherits(TextBox, Box);

TextBox.prototype.endsWithCollapsibleWhitespace = function() {
	var text = collapse(this.text, { format: this.style['white-space'].keyword });
	return / $/.test(text) && this._isCollapsible();
};

TextBox.prototype.collapseWhitespace = function(parent, strip) {
	var format = this.style['white-space'].keyword;
	var text = collapse(this.text, {
		format: format,
		strip: strip
	});

	var clone = new TextBox(parent, text);
	parent.children.push(clone);

	return clone;
};

TextBox.prototype.layout = function(offset, line) {
	var parent = this.parent;
	var style = this.style;
	var position = this._textPosition(line);
	var text = this.text.replace(/\t/g, TAB);

	if(position.first && this._isCollapsible()) text = text.replace(/^ /, '');
	if(position.last && this._isCollapsible()) text = text.replace(/ $/, '');

	this.dimensions.height = this.toPx(style['font-size']);
	this.dimensions.width = textWidth(text, {
		size: this.dimensions.height,
		family: style['font-family'],
		weight: style['font-weight'],
		style: style['font-style']
	});

	this.position.x = parent.position.x + offset.width;
	this.position.y = parent.position.y;
	this.text = text;
};

TextBox.prototype.isCollapsibleWhitespace = function() {
	return this._isWhitespace() && this._isCollapsible();
};

TextBox.prototype.isEmpty = function() {
	return !this.text.length;
};

TextBox.prototype.clone = function(parent) {
	var clone = new TextBox(parent, this.text);
	parent.children.push(clone);

	return clone;
};

TextBox.prototype.toPx = ParentBox.prototype.toPx;

TextBox.prototype._isCollapsible = function() {
	var format = this.style['white-space'];
	return Normal.is(format) || Nowrap.is(format) || PreLine.is(format);
};

TextBox.prototype._isWhitespace = function() {
	return /^[\t\n\r ]*$/.test(this.text);
};

TextBox.prototype._textPosition = function(line) {
	var texts = line.texts().filter(function(t) {
		return !t.isEmpty();
	});

	var i = texts.indexOf(this);

	return {
		first: i === 0,
		last: i >= 0 && i === (texts.length - 1)
	};
};

TextBox.prototype._split = function(length) {

};

module.exports = TextBox;
