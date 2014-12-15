var util = require('util');

module.exports = function(box, context) {
	var style = box.style;

	context.font = util.format('%s %s %s %s',
		style['font-style'],
		style['font-weight'],
		style['font-size'],
		style['font-family']);
	context.fillStyle = style['color'].toString();
	context.fillText(box.text, box.position.x, box.position.y + box.dimensions.height);
};
