var util = require('util');

var values = require('../css/values');
var compute = require('../css/compute');
var Box = require('./box');
var ParentBox = require('./parent-box');
var TextBox = require('./text-box');

var Pre = values.Keyword.Pre;

var LineBreakBox = function(parent, style) {
	Box.call(this, style);
	this.parent = parent;

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(LineBreakBox, Box);

LineBreakBox.prototype.layout = function(offset, line) {
	var parent = this.parent;

	this.position.x = parent.position.x + offset.width;
	this.position.y = parent.position.y;

	parent.breakLine(this);
};

LineBreakBox.prototype.collapseWhitespace = function() {
	return false;
};

LineBreakBox.prototype.hasContent = function() {
	return true;
};

LineBreakBox.prototype.linePosition = function() {
	return this.position;
};

LineBreakBox.prototype.lineHeight = function() {
	return 0;
};

LineBreakBox.prototype.isPx = ParentBox.prototype.isPx;
LineBreakBox.prototype.clone = ParentBox.prototype.clone;
LineBreakBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;

module.exports = LineBreakBox;
