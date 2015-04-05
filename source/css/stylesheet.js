var util = require('util');

var CSSselect = require('CSSselect');
var css = require('css');
var specificity = require('specificity');

var declarations = require('./declarations');
var compare = require('./compare-specificity');
var expand = require('./expand-shorthand');

var parse = function(property, value, order, rule) {
	var declaration = declarations[property];
	return declaration && declaration.parse(property, value, order, rule);
};

var compile = function(selector) {
	try {
		return CSSselect.compile(selector);
	} catch(err) {
		return function() {
			return false;
		};
	}
};

var Rule = function(selector, order, stylesheet) {
	this.selector = selector;
	this.order = order;
	this.stylesheet = stylesheet;

	this.declarations = [];
	this.matches = compile(selector);

	this.specificity = specificity
		.calculate(selector)[0]
		.specificity
		.split(',')
		.map(function(s) {
			return parseInt(s, 10);
		});
};

Rule.prototype.compareTo = function(other) {
	var priority = other.stylesheet && this.stylesheet.comparePriorityTo(other.stylesheet);
	if(priority) return priority;

	var specificity = compare(this.specificity, other.specificity);
	if(specificity) return specificity;

	var order = other.stylesheet && this.stylesheet.compareOrderTo(other.stylesheet);
	return order ? order : this.order - other.order;
};

Rule.prototype.toString = function() {
	return util.format('%s { %s }', this.selector, this.declarations.join(' '));
};

var Stylesheet = function(order, priority) {
	this.order = order || 0;
	this.priority = priority || 0;
	this.rules = [];
};

Stylesheet.empty = function(order, priority) {
	return new Stylesheet(order, priority);
};

Stylesheet.parse = function(str, order, priority) {
	var ast = css.parse(str, { silent: true });
	var rules = ast.stylesheet.rules;

	var stylesheet = new Stylesheet(order, priority);

	rules.forEach(function(r, i) {
		if(r.type !== 'rule' || !r.declarations) return;

		r.selectors.forEach(function(s) {
			var rule = new Rule(s, i, stylesheet);
			var order = 1;

			r.declarations.forEach(function(d) {
				var longhand = expand(d.property, d.value);

				Object.keys(longhand).forEach(function(key) {
					var declaration = parse(key, longhand[key], order, rule);
					if(!declaration) return;

					rule.declarations.push(declaration);
					order++;
				});
			});

			if(rule.declarations.length) stylesheet.rules.push(rule);
		});
	});

	return stylesheet;
};

Stylesheet.prototype.match = function(node) {
	return this.rules.filter(function(rule) {
		return rule.matches(node);
	});
};

Stylesheet.prototype.comparePriorityTo = function(other) {
	return this.priority - other.priority;
};

Stylesheet.prototype.compareOrderTo = function(other) {
	return this.order - other.order;
};

Stylesheet.prototype.toString = function() {
	return this.rules.join(' ');
};

module.exports = Stylesheet;
