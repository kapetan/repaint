module.exports = function(Klass) {
	Klass.prototype.toPx = function(value) {
		if(Auto.is(value)) return 0;
		if(Percentage.is(value)) {
			var width = this.parent.dimensions.width;
			return width * value.percentage / 100;
		}

		return value.length;
	};
};
