var values = require('../../css/values');

var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;

module.exports = function(value, box) {
	if(Auto.is(value)) return 0;
	if(Percentage.is(value)) {
		var width = box.dimensions.width;
		return width * value.percentage / 100;
	}

	return value.length;
};