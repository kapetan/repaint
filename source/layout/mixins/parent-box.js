module.exports = function(Klass) {
	// Object.defineProperty(box, 'children', {
	// 	value: [],
	// 	enumerable: true,
	// 	configurable: true,
	// 	writable: true
	// });



	Klass.prototype.isCollapsibleWhitespace = function() {
		return this.children.every(function(child) {
			return child.isCollapsibleWhitespace();
		});
	};

	Klass.prototype.isWhitespace = function() {
		return this.children.every(function(child) {
			return child.isWhitespace();
		});
	};
};
