var util = require('util');
var css = require('css');

var compare = require('./compare-specificity');
var declarations = require('./declarations');

var parse = function(property, value, order, rule) {
	var declaration = declarations[property];
	return declaration && declaration.parse(property, value, order, rule);
};

var reduce = function(arr, fn) {
	return arr.reduce(function(acc, item) {
		return acc.concat(fn(item));
	}, []);
};

// var mapify = function(arr, property) {
// 	return arr.reduce(function(acc, item) {
// 		acc[item[property]] = item;
// 		return acc;
// 	}, {});
// };

var ElementRule = function(element) {
	this.element = element;

	this.declarations = [];
	this.specificity = [1, 0, 0, 0];
};

ElementRule.parse = function(element, str) {
	str = util.format('element.style { %s }', str);

	var rule = new ElementRule(element);
	var ast = css.parse(str, { silent: true });
	var order = 1;

	var declarations = ast.stylesheet
		.rules[0]
		.declarations.forEach(function(d) {
			var declaration = parse(d.property, d.value, order, rule);
			if(!declaration) return;

			rule.declarations.push(declaration);
			order++;
		});

	return rule;
};

ElementRule.prototype.matches = function(element) {
	return this.element === element;
};

ElementRule.prototype.compareTo = function(other) {
	return compare(this.specificity, other.specificity);
};

ElementRule.prototype.toString = function() {
	return util.format('element.style { %s }', this.declarations.join(' '));
};

module.exports = function(stylesheets, node) {
	var rules = reduce(stylesheets, function(stylesheet) {
		return stylesheet.match(node);
	});

	var declarations = reduce(rules, function(rule) {
		return rule.declarations;
	});

	if(node.attribs.style) {
		var rule = ElementRule.parse(node, node.attribs.style);
		declarations = declarations.concat(rule.declarations);
	}

	declarations.sort(function(a, b) {
		return a.compareTo(b);
	});

	// node.style = mapify(declarations, 'property');

	var style = {};
	declarations.forEach(function(declaration) {
		style[declaration.property] = declaration.value;
	});

	return style;
};
