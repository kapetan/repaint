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
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

var TextBox = function(styleOrParent, text) {
	var isParent = styleOrParent instanceof ParentBox || styleOrParent instanceof Viewport;
	var parent = isParent ? styleOrParent : null;
	var style = isParent ? styleOrParent.style : styleOrParent;

	text = text || '';

	Box.call(this, style);
	this.parent = parent;
	this.text = text;
	this.display = text;

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(TextBox, Box);

TextBox.prototype.layout = function(offset, line) {
	var parent = this.parent;
	var style = this.style;
	var format = style['white-space'].keyword;
	var textContext = this._textContext(line);
	var lines = breaks.hard(this.text, format);

	var textString = function(t) {
		return new TextString(t || '', style);
	};

	var text = textString(lines[0]);
	var isCollapsible = this._isCollapsible();
	var isMultiline = lines.length > 1;

	if(isCollapsible && textContext.precededByEmpty) text.trimLeft();
	if(isCollapsible && (textContext.followedByEmpty || isMultiline)) text.trimRight();

	var x = parent.position.x + offset.width;
	var available = line.position.x + line.dimensions.width - x;
	var rest;

	if(available < 0) {
		rest = this.text;
		text = textString();
	} else if(text.width() > available) {
		var i = 0;
		var words = breaks.soft(text.original, format);
		var fillCurrent, fillNext = textString(words[i]);

		while(fillNext.width() <= available && i++ < words.length) {
			fillCurrent = fillNext;
			fillNext = fillNext.append(words[i]);
		}

		if(!fillCurrent && textContext.first) fillCurrent = textString(words[0]);
		else if(!fillCurrent) fillCurrent = textString();

		if(isCollapsible && textContext.precededByEmpty) fillCurrent.trimLeft();
		if(isCollapsible) fillCurrent.trimRight();

		var newline = fillCurrent.original === text.original ? 1 : 0;

		rest = this.text.slice(fillCurrent.original.length + newline);
		text = fillCurrent;
	} else {
		rest = this.text.slice(text.original.length + 1);
	}

	if(rest || isMultiline) {
		var textBox = rest === this.text ? null : new TextBox(style, rest);
		parent.addLine(this, textBox);
		if(!textBox) return;
	}

	this.dimensions.height = this.toPx(style['font-size']);
	this.dimensions.width = text.width();

	this.position.x = x;
	this.position.y = parent.position.y;

	this.display = text.normalized;
};

TextBox.prototype.endsWithCollapsibleWhitespace = function() {
	var text = collapse(this.text, { format: this.style['white-space'].keyword });
	return / $/.test(text) && this._isCollapsible();
};

TextBox.prototype.collapseWhitespace = function(strip) {
	var wh = this.endsWithCollapsibleWhitespace();
	var text = collapse(this.text, {
		format: this.style['white-space'].keyword,
		strip: strip
	});

	this.text = text;
	return wh;
};

TextBox.prototype.hasContent = function() {
	return !(this._isWhitespace() && this._isCollapsible());
};

TextBox.prototype.linePosition = function() {
	return this.position;
};

TextBox.prototype.lineHeight = function() {
	return this.dimensions.height;
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

TextBox.prototype._textContext = function(line) {
	var contents = line.contents();
	var i = contents.indexOf(this);
	var precededByEmpty = true;
	var followedByEmpty = true;

	for(var j = 0; j < contents.length; j++) {
		var empty = !contents[j].hasContent();
		if(j < i) precededByEmpty = precededByEmpty && empty;
		if(j > i) followedByEmpty = followedByEmpty && empty;
	}

	return {
		first: i === 0,
		last: i === (contents.length - 1),
		precededByEmpty: precededByEmpty,
		followedByEmpty: followedByEmpty
	};
};

module.exports = TextBox;
