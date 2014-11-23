var declarations = require('./declarations');
var values = require('./values');

var Keyword = values.Keyword;
var PROPERTIES = Object.keys(declarations);

// var parentOrInitial = function(property, node) {
// 	var parent = node.parentNode;
// 	return parent ? parent.style[property] : declarations[property].INITIAL;
// };

// var initial = function(property) {
// 	return declarations[property].INITIAL;
// };

// var inherit = function(property, node) {
// 	var Declaration = declarations[property];
// 	var parent = node.parentNode;

// 	return parent ? parent.style[property] : Declaration.INITIAL;
// };

// var currentColor = function(property, node) {
// 	return property === 'color' ?
// 		parentOrInitial('color', node) :
// 		compute('color', node);
// };

// var em = function(property, node) {
// 	var length = node.style[property].length;
// 	var basis = property === 'font-size' ?
// 		parentOrInitial('font-size', node) :
// 		compute('font-size', node);

// 	return values.Length.px(basis.length * length);
// };

// var fontPercentage = function(property, node) {
// 	var percent = node.style[property].percentage;
// 	var basis = property === 'font-size' ?
// 		parentOrInitial('font-size', node) :
// 		compute('font-size', node);

// 	return values.Length.px(basis.length * percent / 100);
// };

// var compute = function(property, node) {
// 	var value = node.style[property];
// 	var Declaration = declarations[property];

// 	if(!value) {
// 		if(Declaration.INHERITED) return inherit(property, node);
// 		else return Declaration.INITIAL;
// 	} else {
// 		if(Keyword.Inherit.is(value)) return inherit(property, node);
// 		if(Keyword.Initial.is(value)) return initial(property);
// 		if(Keyword.CurrentColor.is(value)) return currentColor(property, node);
// 		if(values.Length.is(value) && value.unit === 'em') return em(property, node);
// 		if(property === 'line-height' && values.Percentage.is(value)) return fontPercentage(property, node);
// 		if(property === 'font-size' && values.Percentage.is(value)) return fontPercentage(property, node);
// 	}

// 	return value;
// };

// module.exports = function(node) {
// 	PROPERTIES.forEach(function(property) {
// 		node.style[property] = compute(property, node);
// 	});
// };

module.exports = function(style, parentStyle) {
	var parentOrInitial = function(property) {
		return parentStyle ? parentStyle[property] : declarations[property].INITIAL;
	};

	var initial = function(property) {
		return declarations[property].INITIAL;
	};

	var inherit = function(property) {
		var Declaration = declarations[property];
		return parentStyle ? parentStyle[property] : Declaration.INITIAL;
	};

	var currentColor = function(property) {
		return property === 'color' ?
			parentOrInitial('color') :
			compute('color');
	};

	var em = function(property) {
		var length = style[property].length;
		var basis = property === 'font-size' ?
			parentOrInitial('font-size') :
			compute('font-size');

		return values.Length.px(basis.length * length);
	};

	var fontPercentage = function(property) {
		var percent = style[property].percentage;
		var basis = property === 'font-size' ?
			parentOrInitial('font-size') :
			compute('font-size');

		return values.Length.px(basis.length * percent / 100);
	};

	var compute = function(property) {
		var value = style[property];
		var Declaration = declarations[property];

		if(!value) {
			if(Declaration.INHERITED) return inherit(property);
			else return Declaration.INITIAL;
		} else {
			if(Keyword.Inherit.is(value)) return inherit(property);
			if(Keyword.Initial.is(value)) return initial(property);
			if(Keyword.CurrentColor.is(value)) return currentColor(property);
			if(values.Length.is(value) && value.unit === 'em') return em(property);
			if(property === 'line-height' && values.Percentage.is(value)) return fontPercentage(property);
			if(property === 'font-size' && values.Percentage.is(value)) return fontPercentage(property);
		}

		return value;
	};

	PROPERTIES.forEach(function(property) {
		style[property] = compute(property);
	});

	return style;
};
