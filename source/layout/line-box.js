var util = require('util');
var ParentBox = require('./parent-box');

var LineBox = function(parent) {
	ParentBox.call(this, parent);
};

util.inherits(LineBox, ParentBox);

LineBox.prototype.collapseWhitespace = function() {
	if(this.isCollapsibleWhitespace()) return this.detach();

	var box, strip = false;

	this.children.forEach(function(child) {
		box = child.collapseWhitespace(strip);
		strip = box ? box.endsWithCollapsibleWhitespace() : strip;
	});

	return box;
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
		child.layout(offset);
		offset.height += child.width();
		self.dimensions.height = Math.max(self.dimensions.height, child.height());
	});
};

module.exports = LineBox;
