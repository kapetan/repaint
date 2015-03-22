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

ParentBox.prototype.addLine = function(child, branch, force) {
	this.stopEach();

	var parent = this.parent;
	var i = this.children.indexOf(child);
	if(i === 0 && !branch && !force) return parent.addLine(this);

	var children = this.children.slice();
	var box = this.clone();

	if(branch) box.attach(branch);
	else box.attach(child);

	for(var j = i + 1; j < children.length; j++) {
		box.attach(children[j]);
	}

	this.addLink(box);
	parent.addLine(this, box);
};

ParentBox.prototype.breakLine = function(child) {
	var children = this.children.slice();
	var box = this.clone();
	var i = children.indexOf(child);

	for(var j = i + 1; j < children.length; j++) {
		box.attach(children[j]);
	}

	this.addLink(box);
	this.parent.addLine(this, box);
};

ParentBox.prototype.hasContent = function() {
	var hasOutline = this.padding.some() ||
		this.border.some() ||
		this.margin.some();

	return hasOutline || this.children.some(function(child) {
		return child.hasContent();
	});
};

ParentBox.prototype.collapseWhitespace = function(strip) {
	this.children.forEach(function(child) {
		strip = child.collapseWhitespace(strip);
	});

	return strip;
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

ParentBox.prototype.translate = function(dx, dy) {
	Box.prototype.translate.call(this, dx, dy);
	this.translateChildren(dx, dy);
};

ParentBox.prototype.translateChildren = function(dx, dy) {
	this.children.forEach(function(child) {
		child.translate(dx, dy);
	});
};

ParentBox.prototype.visibleWidth = function() {
	var min = function(box) {
		return box.position.x - box.leftWidth();
	};

	var max = function(box) {
		return box.position.x + box.dimensions.width + box.rightWidth();
	};

	var minX = min(this);
	var maxX = max(this);

	var height = function(parent) {
		minX = Math.min(minX, min(parent));
		maxX = Math.max(maxX, max(parent));

		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	return maxX - minX;
};

ParentBox.prototype.visibleHeight = function() {
	var min = function(box) {
		return box.position.y - box.topWidth();
	};

	var max = function(box) {
		return box.position.y + box.dimensions.height + box.bottomWidth();
	};

	var minY = min(this);
	var maxY = max(this);

	var height = function(parent) {
		minY = Math.min(minY, min(parent));
		maxY = Math.max(maxY, max(parent));

		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	return maxY - minY;
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
