var util = require('util');
var textWidth = require('text-width');

var values = require('../css/values');
var collapse = require('./whitespace/collapse');
var breaks = require('./whitespace/breaks');
var Box = require('./box');
var ParentBox = require('./parent-box');
var Viewport = require('./viewport');

var Normal = values.Keyword.Normal;
var Nowrap = values.Keyword.Nowrap;
var PreLine = values.Keyword.PreLine;
var PreWrap = values.Keyword.PreWrap;

var TAB = '        ';

var TextString = function(str, style) {
	this.original = str;
	this.style = style;

	this.normalized = str.replace(/\t/g, TAB);
};

TextString.prototype.trimLeft = function() {
	this.normalized = this.normalized.replace(/^ /, '');
};

TextString.prototype.trimRight = function() {
	this.normalized = this.normalized.replace(/ $/, '');
};

TextString.prototype.append = function(str) {
	return new TextString(this.original + str, this.style);
};

TextString.prototype.width = function() {
	var style = this.style;

	return textWidth(this.normalized, {
		size: style['font-size'].toString(),
		family: style['font-family'].keyword,
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

var TextBox = function(styleOrParent, text) {
	var isParent = styleOrParent instanceof ParentBox || styleOrParent instanceof Viewport;
	var parent = isParent ? styleOrParent : null;
	var style = isParent ? styleOrParent.style : styleOrParent;

	Box.call(this, style);
	this.parent = parent;
	this.text = text;

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(TextBox, Box);

TextBox.prototype.layout = function(offset, line) {
	var parent = this.parent;
	var style = this.style;
	var format = style['white-space'].keyword;
	var position = this._textPosition(line);
	var lines = breaks.hard(this.text, format);
	var text = new TextString(lines[0], style);

	var isFirst = position.first;
	var isLast = position.last;
	var isCollapsible = this._isCollapsible();
	var isMultiline = lines.length > 1;

	if(isCollapsible && isFirst) text.trimLeft();
	if(isCollapsible && (isLast || isMultiline)) text.trimRight();

	var x = parent.position.x + offset.width;
	var available = line.position.x + line.dimensions.width - x;
	var rest;

	if(available < 0) {
		rest = this.text;
		text = new TextString('', style);
	} else if(text.width() > available) {
		var i = 0;
		var words = breaks.soft(text.original, format);
		var fillCurrent, fillNext = new TextString(words[i], style);

		while(fillNext.width() <= available && i++ < words.length) {
			fillCurrent = fillNext;
			fillNext = fillNext.append(words[i]);
		}

		if(!fillCurrent && isFirst) fillCurrent = new TextString(words[0], style);
		else if(!fillCurrent) fillCurrent = new TextString('', style);

		if(isCollapsible && isFirst) fillCurrent.trimLeft();
		if(isCollapsible) fillCurrent.trimRight();

		var newline = fillCurrent.original.length === text.original.length ? 1 : 0;

		rest = this.text.slice(fillCurrent.original.length + newline);
		text = fillCurrent;
	} else {
		rest = this.text.slice(text.original.length + 1);
	}

	if(rest || isMultiline) {
		var textBox = new TextBox(style, rest);
		parent.addLine(this, textBox);
	}

	this.dimensions.height = this.toPx(style['font-size']);
	this.dimensions.width = text.width();

	this.position.x = x;
	this.position.y = parent.position.y;

	this.text = text.normalized;
};

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

TextBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;
TextBox.prototype.addLink = ParentBox.prototype.addLink;
TextBox.prototype.toPx = ParentBox.prototype.toPx;

TextBox.prototype._isCollapsible = function() {
	var format = this.style['white-space'];
	return Normal.is(format) || Nowrap.is(format) || PreLine.is(format);
};

TextBox.prototype._isWhitespace = function() {
	return /^[\t\n\r ]*$/.test(this.text);
};

TextBox.prototype._textWidth = function(size, text) {
	var style = this.style;

	return textWidth(text, {
		size: size,
		family: style['font-family'].keyword,
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
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

module.exports = TextBox;
