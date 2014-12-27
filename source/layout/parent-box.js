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

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(ParentBox, Box);

ParentBox.prototype.layout = function() {};

ParentBox.prototype.addLink = function(box) {
	box.leftLink = true;
	box.rightLink = this.rightLink;

	this.rightLink = true;
};

ParentBox.prototype.addLine = function(child, branch) {
	this.stopEach();

	var children = this.children.slice();
	var box = this.clone();
	box.attach(branch);

	for(var i = children.indexOf(child) + 1; i < children.length; i++) {
		box.attach(children[i]);
	}

	this.addLink(box);
	this.parent.addLine(this, box);
};

ParentBox.prototype.isCollapsibleWhitespace = function() {
	return this.children.every(function(child) {
		return child.isCollapsibleWhitespace();
	});
};

ParentBox.prototype.attach = function(node, i) {
	if(node.parent) node.parent.detach(node);

	node.parent = this;

	if(i !== undefined) this.children.splice(i, 0, node);
	else this.children.push(node);
};

ParentBox.prototype.detach = function(node) {
	var children = this.children;
	var i = children.indexOf(node);

	if(i < 0) return;

	node.parent = null;
	children.splice(i, 1);
};

ParentBox.prototype.clone = function(parent) {
	var clone = new this.constructor(parent, this.style);
	if(parent) parent.children.push(clone);

	return clone;
};

ParentBox.prototype.cloneWithLinks = function(parent) {
	var clone = this.clone(parent);
	clone.leftLink = this.leftLink;
	clone.rightLink = this.rightLink;

	return clone;
};

ParentBox.prototype.forEach = function(fn) {
	var children = this.children;
	var stop = false;

	this._stop = function() {
		stop = true;
	};

	for(var i = 0; i < children.length && !stop; i++) {
		fn(children[i], i);
	}
};

ParentBox.prototype.stopEach = function() {
	if(this._stop) this._stop();
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
