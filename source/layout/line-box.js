var util = require('util');

var ParentBox = require('./parent-box');
var TextBox = require('./text-box');

var LineBox = function(parent) {
	ParentBox.call(this, parent);
};

util.inherits(LineBox, ParentBox);

LineBox.prototype.flatten = function() {
	var descedants = [];
	var flatten = function(parent) {
		descedants.push(parent);
		if(parent.children) parent.children.forEach(flatten);
	};

	this.children.forEach(flatten);
	return descedants;
};

LineBox.prototype.texts = function() {
	return this.flatten().filter(function(box) {
		return box instanceof TextBox;
	});
};

LineBox.prototype.addLine = function(child) {

};

LineBox.prototype.layout = function(offset) {
	var parent = this.parent;

	this.dimensions.width = parent.width();

	this.position.x = parent.position.x;
	this.position.y = parent.position.y + offset.height;

	this._layoutChildren();
};

LineBox.prototype._layoutChildren = function() {
	var self = this;
	var offset = { width: 0, height: 0 };

	this.children.forEach(function(child) {
		child.layout(offset, self);
		offset.width += child.width();
		self.dimensions.height = Math.max(self.dimensions.height, child.dimensions.height);
	});
};

module.exports = LineBox;
