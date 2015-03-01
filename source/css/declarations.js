var util = require('util');
var capitalize = require('capitalize');
var camelize = require('camelize');

var values = require('./values');
var declarations = require('./declarations.json');

var resolve = function(arr) {
	return arr
		.concat(['inherit', 'initial'])
		.map(function(val) {
			if(Array.isArray(val)) {
				var resolved = resolve(val);
				return values.CommaSeparated.define(resolved);
			}

			if(val === values.Length.TYPE) return values.Length;
			if(val === values.Percentage.TYPE) return values.Percentage;
			if(val === values.Number.TYPE) return values.Number;
			if(val === values.Color.TYPE) return values.Color;
			if(val === values.FamilyName.TYPE) return values.FamilyName;
			else {
				val = capitalize(camelize(val));
				return values.Keyword[val];
			}
		});
};

var parse = function(arr, value) {
	for(var i = 0; i < arr.length; i++) {
		var v = arr[i].parse(value);
		if(v) return v;
	}
};

var define = function(property, definition) {
	var Klass = function(value, important, order, rule) {
		if(!(this instanceof Klass)) return new Klass(value);

		this.value = value;
		this.important = important;
		this.order = order;
		this.rule = rule;
	};

	Klass.parse = function(p, v, order, rule) {
		if(property !== p.toLowerCase()) return;

		var important = /\s+!important$/.test(v);

		v = v.replace(/\s+!important$/, '');
		v = parse(Klass.VALUES, v);

		if(v) return new Klass(v, important, order, rule);
	};

	Klass.PROPERTY = property;
	Klass.VALUES = resolve(definition.values);
	Klass.INITIAL = parse(Klass.VALUES, definition.initial);
	Klass.INHERITED = definition.inherited;

	Klass.prototype.property = property;

	Klass.prototype.compareTo = function(other) {
		if(!this.important && other.important) return -1;
		if(this.important && !other.important) return 1;

		var specificity = this.rule.compareTo(other.rule);
		if(specificity) return specificity;

		return this.order - other.order;
	};

	Klass.prototype.toString = function() {
		return util.format('%s: %s;', property, this.value);
	};

	return Klass;
};

Object.keys(declarations).forEach(function(property) {
	var definition = declarations[property];
	definition = (typeof definition === 'string') ? declarations[definition] : definition;

	exports[property] = define(property, definition);
});
