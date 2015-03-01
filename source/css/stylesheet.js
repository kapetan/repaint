var util = require('util');

var CSSselect = require('CSSselect');
var css = require('css');
var specificity = require('specificity');

var declarations = require('./declarations');
var compare = require('./compare-specificity');

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
	var priority = other.stylesheet && this.stylesheet.compareTo(other.stylesheet);
	if(priority) return priority;

	var diff = compare(this.specificity, other.specificity);
	return diff ? diff : this.order - other.order;
};

Rule.prototype.toString = function() {
	return util.format('%s { %s }', this.selector, this.declarations.join(' '));
};

var Stylesheet = function(priority) {
	this.priority = priority || 0;
	this.rules = [];
};

Stylesheet.empty = function() {
	return new Stylesheet();
};

Stylesheet.parse = function(str, priority) {
	var ast = css.parse(str, { silent: true });
	var rules = ast.stylesheet.rules;

	var stylesheet = new Stylesheet(priority);

	rules.forEach(function(r) {
		if(r.type !== 'rule') return;

		r.selectors.forEach(function(s) {
			var rule = new Rule(s, r.position.start.line, stylesheet);
			var order = 1;

			r.declarations.forEach(function(d) {
				var declaration = parse(d.property, d.value, order, rule);
				if(!declaration) return;

				rule.declarations.push(declaration);
				order++;
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

Stylesheet.prototype.compareTo = function(other) {
	return this.priority - other.priority;
};

Stylesheet.prototype.toString = function() {
	return this.rules.join(' ');
};

module.exports = Stylesheet;
