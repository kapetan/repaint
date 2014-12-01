var util = require('util');
var capitalize = require('capitalize');
var camelize = require('camelize');

var declarations = require('./declarations.json');

var VALUE_WITH_UNIT = /^(\d+(?:\.\d+)?)((?:\%|\w)+)$/;
var NUMBER = /^\d+(?:\.\d+)?$/;
var INTEGER = /^\d+$/;

var COLOR_HEX = /^#([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})$/;
var COLOR_RGBA = /^rgb(a?)\(([^)]+)\)$/;

var define = function(fn) {
	var Klass = function() {
		var self = Object.create(Klass.prototype);
		fn.apply(self, arguments);

		return self;
	};

	return Klass;
};

var keywords = function(values, Klass) {
	values.forEach(function(v) {
		if(Array.isArray(v)) return keywords(v, Klass);

		var	isPredefined = v === Length.TYPE || v === Percentage.TYPE ||
			v === Number.TYPE || v === Color.TYPE;

		if(isPredefined) return;

		var n = capitalize(camelize(v));
		if(Klass[n]) return;

		Klass[n] = new Klass(v);
	});
};

var CommaSeparated = define(function(values) {
	this.values = values;
});

CommaSeparated.TYPE = '<comma-separated>';

CommaSeparated.parse = function(str, definitions) {
	var parseValue = function(value) {
		for(var i = 0; i < definitions.length; i++) {
			var v = definitions[i].parse(value);
			if(v) return v;
		}
	};

	var values = str
		.split(',')
		.map(function(v) {
			v = v.trim();
			return parseValue(v);
		})
		.filter(Boolean);

	return new CommaSeparated(values);
};

CommaSeparated.define = function(definitions) {
	var Klass = function(values) {
		return new CommaSeparated(values);
	};

	Klass.TYPE = CommaSeparated.TYPE;
	Klass.is = CommaSeparated.is;

	Klass.parse = function(str) {
		return CommaSeparated.parse(str, definitions);
	};

	return Klass;
};

CommaSeparated.is = function(value) {
	return value.type === CommaSeparated.TYPE;
};

CommaSeparated.prototype.type = CommaSeparated.TYPE;
CommaSeparated.prototype.toString = function() {
	return this.values.join(', ');
};

var Length = define(function(length, unit) {
	this.length = length;
	this.unit = unit;
});

Length.TYPE = '<length>';
Length.UNITS = ['px', 'em'];

Length.parse = function(str) {
	var match = str.match(VALUE_WITH_UNIT);
	if(!match) {
		if(str !== '0') return;
		return new Length(0, 'px');
	}

	var number = match[1];
	var unit = match[2];

	if(!NUMBER.test(number) || Length.UNITS.indexOf(unit) === -1) return;

	return new Length(parseFloat(number), unit);
};

Length.is = function(value) {
	return value.type === Length.TYPE;
};

Length.px = function(length) {
	return new Length(length, 'px');
};

Length.em = function(length) {
	return new Length(length, 'em');
};

Length.prototype.type = Length.TYPE;
Length.prototype.toString = function() {
	return this.length + this.unit;
};

var Percentage = define(function(percentage) {
	this.percentage = percentage;
});

Percentage.TYPE = '<percentage>';

Percentage.parse = function(str) {
	var match = str.match(VALUE_WITH_UNIT);
	if(!match || match[2] !== '%') return;

	return new Percentage(parseFloat(match[1]));
};

Percentage.is = function(value) {
	return value.type === Percentage.TYPE;
};

Percentage.prototype.type = Percentage.TYPE;
Percentage.prototype.toString = function() {
	return this.percentage + '%';
};

var Number = define(function(number) {
	this.number = number;
});

Number.TYPE = '<number>';

Number.parse = function(str) {
	if(NUMBER.test(str)) return parseFloat(str);
};

Number.is = function(value) {
	return value.type === Number.TYPE;
};

Number.prototype.type = Number.TYPE;
Number.prototype.toString = function() {
	return this.number.toString();
};

var Color = define(function(red, green, blue, alpha) {
	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = (typeof alpha !== 'number') ? 1 : alpha;
});

Color.TYPE = '<color>';

Color.parse = function(str) {
	var match = str.match(COLOR_HEX);

	if(match) {
		var red = parseInt(match[1], 16);
		var green = parseInt(match[2], 16);
		var blue = parseInt(match[3], 16);

		return new Color(red, green, blue);
	}

	match = str.match(COLOR_RGBA);

	if(match) {
		var alpha = match[1];
		var args = match[2].split(',').map(function(arg) {
			return arg.trim();
		});

		if(alpha && args.length !== 4) return;
		if(!alpha && args.length !== 3) return;

		var rgb = args.slice(0, 3);
		var valid = rgb.every(function(arg) {
			return INTEGER.test(arg);
		});

		if(!valid) return;
		if(alpha && !NUMBER.test(args[3])) return;

		alpha = alpha && parseFloat(args[3]);
		rgb = rgb.map(function(arg) {
			return parseInt(arg, 10);
		});

		return new Color(rgb[0], rgb[1], rgb[2], alpha);
	}
};

Color.is = function(value) {
	return value.type === Color.TYPE;
};

Color.prototype.type = Color.TYPE;
Color.prototype.toString = function() {
	return util.format('rgba(%s, %s, %s, %s)', this.red, this.green, this.blue, this.alpha);
};

var FamilyName = define(function(name) {
	this.name = name;
});

FamilyName.TYPE = '<family-name>';

FamilyName.parse = function(str) {
	var first = str.charAt(0);
	var last = str.charAt(str.length - 1);

	var isFirstQuote = /'|"/.test(first);
	var isLastQuote = /'|"/.test(last);

	if((isFirstQuote || isLastQuote) && first !== last) return;
	return new FamilyName(str);
};

FamilyName.is = function(value) {
	return value.type === FamilyName.TYPE;
};

FamilyName.prototype.type = FamilyName.TYPE;
FamilyName.prototype.toString = function() {
	return util.format('"%s"', this.name);
};

var Keyword = define(function(keyword) {
	this.keyword = keyword;
	this.normalized = keyword.toLowerCase();
	this.type = keyword;
});

Keyword.prototype.parse = function(str) {
	if(this.normalized === str.toLowerCase()) return this;
};

Keyword.prototype.is = function(value) {
	return !!(value.keyword && value.keyword === this.keyword);
};

Keyword.prototype.toString = function() {
	return this.keyword;
};

Object.keys(declarations).forEach(function(property) {
	var definition = declarations[property];
	if(typeof definition === 'string') return;

	keywords(definition.values, Keyword);
});

Keyword.Initial = new Keyword('initial');
Keyword.Inherit = new Keyword('inherit');

exports.CommaSeparated = CommaSeparated;
exports.Length = Length;
exports.Percentage = Percentage;
exports.Number = Number;
exports.Color = Color;
exports.FamilyName = FamilyName;
exports.Keyword = Keyword;
