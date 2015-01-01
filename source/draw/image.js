module.exports = function(box, context) {
	context.drawImage(box.image.data,
		box.position.x,
		box.position.y,
		box.dimensions.width,
		box.dimensions.height);
};
