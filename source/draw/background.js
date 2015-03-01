module.exports = function(box, context) {
	var color = box.style['background-color'];

	if((!box.innerWidth() && !box.innerHeight()) || !color.alpha) return;

	var x = box.position.x - box.padding.left;
	var y = box.position.y - box.padding.top;
	var width = box.padding.left + box.dimensions.width + box.padding.right;
	var height = box.padding.top + box.dimensions.height + box.padding.bottom;

	context.fillStyle = color.toString();
	context.fillRect(x, y, width, height);
};
