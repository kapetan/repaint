var util = require('util');

var Box = require('./box');
var compute = require('../css/compute');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;

var ParentBox = function(parent, style) {
	Box.call(this, style);

	this.style = style || compute({}, parent.style);
	this.parent = parent;
	this.children = [];
};

util.inherits(ParentBox, Box);

ParentBox.prototype.layout = function() {};

ParentBox.prototype.isCollapsibleWhitespace = function() {
	return this.children.every(function(child) {
		return child.isCollapsibleWhitespace();
	});
};

ParentBox.prototype.clone = function(parent) {
	var clone = new this.constructor(parent, this.style);
	parent.children.push(clone);

	return clone;
};

ParentBox.prototype.toPx = function(value) {
	if(Auto.is(value)) return 0;
	if(Percentage.is(value)) {
		var width = this.parent.dimensions.width;
		return width * value.percentage / 100;
	}

	return value.length;
};

module.exports = ParentBox;
