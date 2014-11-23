var util = require('util');
var capitalize = require('capitalize');
var camelize = require('camelize');

var declarations = require('./declarations.json');

var VALUE_WITH_UNIT = /^(\d+(?:\.\d+)?)((?:\%|\w)+)$/;
var NUMBER = /^\d+(?:\.\d+)?$/;

var COLOR_HEX = /^#([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})$/;

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

// var CommaSeparated = define(function(definitions) {
// 	this.definitions = definitions;
// });

// CommaSeparated.TYPE = '<comma-separated>';

// CommaSeparated.is = function(value) {
// 	return value.type === CommaSeparated.TYPE;
// };

// CommaSeparated.create = function(values) {
// 	return {
// 		values: values,
// 		type: CommaSeparated.TYPE,
// 		toString: function() {
// 			return this.values.join(', ');
// 		}
// 	};
// };

// CommaSeparated.prototype.parse = function(str) {
// 	var self = this;
// 	var values = str
// 		.split(',')
// 		.map(function(v) {
// 			v = v.trim();
// 			return self._parse(v);
// 		})
// 		.filter(Boolean);

// 	return CommaSeparated.create(values);
// };

// CommaSeparated.prototype._parse = function(val) {
// 	for(var i = 0; i < this.definitions.length; i++) {
// 		var v = this.definitions[i].parse(value);
// 		if(v) return v;
// 	}
// };

// CommaSeparated.prototype.type = CommaSeparated.TYPE;
// CommaSeparated.prototype.toString = function() {
// 	return this.values.join(', ');
// };

// var define = function(type, fn) {
// 	var klass = function() {
// 		var self = Object.create(klass.prototype);
// 		fn.apply(self, arguments);

// 		return self;
// 	};

// 	klass.TYPE = type;
// 	klass.prototype.type = type;

// 	return klass;
// };

// var keyword = function(type, name) {
// 	var klass = define(type, function() {});

// 	klass.parse = function(str) {
// 		if(name === str.toLowerCase()) return new klass();
// 	};

// 	klass.prototype.toString = function() {
// 		return name;
// 	};

// 	return klass;
// };

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
	this.alpha = alpha || 1;
});

Color.TYPE = '<color>';

Color.parse = function(str) {
	var match = str.match(COLOR_HEX);
	if(!match) return;

	var red = parseInt(match[1], 16);
	var green = parseInt(match[2], 16);
	var blue = parseInt(match[3], 16);

	return new Color(red, green, blue);
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

	// definition.values.forEach(function(v) {
	// 	var	isPredefined = v === Length.TYPE || v === Percentage.TYPE ||
	// 		v === Number.TYPE || v === Color.TYPE;

	// 	if(isPredefined) return;

	// 	v = capitalize(camelize(v));
	// 	if(Keyword[v]) return;

	// 	Keyword[v] = new Keyword(v);
	// });
});

Keyword.Initial = new Keyword('initial');
Keyword.Inherit = new Keyword('inherit');

// Keyword.Initial = new Keyword('initial');
// Keyword.Inherit = new Keyword('inherit');
// Keyword.Auto = new Keyword('auto');
// Keyword.Left = new Keyword('left');
// Keyword.Right = new Keyword('right');
// Keyword.Center = new Keyword('center');
// Keyword.Inline = new Keyword('inline');
// Keyword.Block = new Keyword('block');
// Keyword.None = new Keyword('none');


// exports.Inherit = keyword('Inherit', 'inherit');

// exports.Auto = keyword('Auto', 'auto');

// exports.Left = keyword('Left', 'left');
// exports.Right = keyword('Right', 'right');
// exports.Center = keyword('Center', 'center');

// exports.Inline = keyword('Inline', 'inline');
// exports.Block = keyword('Block', 'block');
// exports.None = keyword('None', 'none');

exports.CommaSeparated = CommaSeparated;
exports.Length = Length;
exports.Percentage = Percentage;
exports.Number = Number;
exports.Color = Color;
exports.FamilyName = FamilyName;
exports.Keyword = Keyword;
