var util = require('util');

module.exports = function(box, context) {
	context.font = util.format('%s %s', box.style['font-size'], box.style['font-family']);
	context.fillStyle = box.style['color'].toString();
	context.fillText(box.text, box.position.x, box.position.y + box.dimensions.height);
};
