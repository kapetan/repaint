// var util = require('util');

var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');

var background = require('./draw/background');
var border = require('./draw/border');
var text = require('./draw/text');

// var drawText = function(box, context) {
// 	context.font = util.format('%s %s', box.style['font-size'], box.style['font-family']);
// 	context.fillStyle = box.style['color'].toString();
// 	context.fillText(box.text, box.position.x, box.position.y);
// };

// var drawBackground = function(box, context) {
// 	var x = box.position.x - box.padding.left;
// 	var y = box.position.y - box.padding.top;
// 	var width = box.padding.left + box.dimensions.width + box.padding.right;
// 	var height = box.padding.top + box.dimensions.height + box.padding.bottom;

// 	context.fillStyle = box.style['background-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// var drawBorderTop = function(box, context) {
// 	if(!box.border.top) return;

// 	var x = box.position.x - box.padding.left - box.border.left;
// 	var y = box.position.y - box.padding.top - box.border.top;
// 	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
// 	var height = box.border.top;

// 	context.fillStyle = box.style['border-top-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// var drawBorderRight = function(box, context) {
// 	if(!box.border.right) return;

// 	var x = box.position.x + box.dimensions.width + box.padding.right;
// 	var y = box.position.y - box.padding.top - box.border.top;
// 	var width = box.border.right;
// 	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

// 	context.fillStyle = box.style['border-right-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// var drawBorderBottom = function(box, context) {
// 	if(!box.border.bottom) return;

// 	var x = box.position.x - box.padding.left - box.border.left;
// 	var y = box.position.y + box.dimensions.height + box.padding.bottom;
// 	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
// 	var height = box.border.bottom;

// 	context.fillStyle = box.style['border-bottom-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

// var drawBorderLeft = function(box, context) {
// 	if(!box.border.left) return;

// 	var x = box.position.x - box.padding.left - box.border.left;
// 	var y = box.position.y - box.padding.top - box.border.top;
// 	var width = box.border.left;
// 	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

// 	context.fillStyle = box.style['border-left-color'].toString();
// 	context.fillRect(x, y, width, height);
// };

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

	// drawBackground(box, context);

	// drawBorderTop(box, context);
	// drawBorderRight(box, context);
	// drawBorderBottom(box, context);
	// drawBorderLeft(box, context);

	drawChildren(box, context);
};

module.exports = draw;
