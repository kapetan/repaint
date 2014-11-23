var drawBorderTop = function(box, context) {
	if(!box.border.top) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
	var height = box.border.top;

	context.fillStyle = box.style['border-top-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderRight = function(box, context) {
	if(!box.border.right) return;

	var x = box.position.x + box.dimensions.width + box.padding.right;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.right;
	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

	context.fillStyle = box.style['border-right-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderBottom = function(box, context) {
	if(!box.border.bottom) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y + box.dimensions.height + box.padding.bottom;
	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
	var height = box.border.bottom;

	context.fillStyle = box.style['border-bottom-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderLeft = function(box, context) {
	if(!box.border.left) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.left;
	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

	context.fillStyle = box.style['border-left-color'].toString();
	context.fillRect(x, y, width, height);
};

module.exports = function(box, context) {
	drawBorderTop(box, context);
	drawBorderRight(box, context);
	drawBorderBottom(box, context);
	drawBorderLeft(box, context);
};
