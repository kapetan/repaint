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

	this._laidOut = false;
};

util.inherits(LineBreakBox, Box);

LineBreakBox.prototype.layout = function() {
	if(this._laidOut) return;
	this._laidOut = true;

	this.parent.addLine(this);
};

LineBreakBox.prototype.collapseWhitespace = function() {
	return false;
};

LineBreakBox.prototype.hasContent = function() {
	return true;
};

LineBreakBox.prototype.isPx = ParentBox.prototype.isPx;
LineBreakBox.prototype.clone = ParentBox.prototype.clone;
LineBreakBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;

module.exports = LineBreakBox;
