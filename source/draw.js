var Viewport = require('./layout/viewport');
var LineBox = require('./layout/line-box');
var TextBox = require('./layout/text-box');

var background = require('./draw/background');
var border = require('./draw/border');
var text = require('./draw/text');

var drawChildren = function(box, context) {
	box.children.forEach(function(child) {
		draw(child, context);
	});
};

var draw = function(box, context) {
	if(box instanceof Viewport || box instanceof LineBox) return drawChildren(box, context);
	if(box instanceof TextBox) return text(box, context);

	background(box, context);
	border(box, context);

	drawChildren(box, context);
};

module.exports = draw;
