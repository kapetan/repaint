var util = require('util');

var values = require('../css/values');
var Box = require('./box');
var ParentBox = require('./parent-box');

var Normal = values.Keyword.Normal;
var Nowrap = values.Keyword.Nowrap;
var PreLine = values.Keyword.PreLine;

var LineBreakBox = function(parent, style) {
	Box.call(this, style);
	this.parent = parent;

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(LineBreakBox, Box);

LineBreakBox.prototype.layout = function() {};

LineBreakBox.prototype.isCollapsibleWhitespace = function() {
	var format = this.style['white-space'];
	return Normal.is(format) || Nowrap.is(format) || PreLine.is(format);
};

LineBreakBox.prototype.isPx = ParentBox.prototype.isPx;
LineBreakBox.prototype.clone = ParentBox.prototype.clone;
LineBreakBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;

module.exports = LineBreakBox;
