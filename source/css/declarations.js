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

		var match = v.match(/^(\S+)(?:\s+(!important))?$/);
		if(!match) return;

		var important = !!match[2];

		v = match[1];
		v = parse(Klass.VALUES, v);

		if(v) return new Klass(v, important, order, rule);
	};

	Klass.PROPERTY = property;
	Klass.VALUES = resolve(definition.values);
	Klass.INITIAL = parse(Klass.VALUES, definition.initial);
	Klass.INHERITED = definition.inherited;

	Klass.prototype.property = property;
	// Klass.prototype.initial = Klass.INITIAL;
	// Klass.prototype.inherited = Klass.INHERITED;

	Klass.prototype.compareTo = function(other) {
		if(!this.important && other.important) return -1;
		if(this.important && !other.important) return 1;

		// var hasRules = this.rule && other.rule;
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

// var parse = function(arr, value) {
// 	for(var i = 0; i < arr.length; i++) {
// 		var fn = arr[i].parse;
// 		var v = fn(value);

// 		if(v) return v;
// 	}
// };

// var define = function(type, property) {
// 	var klass = function(value) {
// 		if(!(this instanceof klass)) return new klass(value);
// 		this.value = value;
// 	};

// 	klass.parse = function(p, v) {
// 		if(property !== p.toLowerCase()) return;

// 		v = parse(klass.VALUES, v);
// 		if(v) return new klass(v);
// 	};

// 	klass.TYPE = type;
// 	klass.PROPERTY = property;
// 	klass.prototype.type = type;
// 	klass.prototype.property = property;

// 	klass.prototype.toString = function() {
// 		return util.format('%s: %s;', property, this.value);
// 	};

// 	// klass.prototype.computed = function(node) {
// 	// 	if(this.value.type === values.Inherit.TYPE) {
// 	// 		var parentNode = node.parentNode;

// 	// 		if(!parentNode) return klass.INITIAL;
// 	// 		return this.computed(parentNode);
// 	// 	}

// 	// 	return this.value;
// 	// };

// 	return klass;
// };

// var Display = define('Display', 'display');
// Display.INITIAL = values.Inline();
// Display.VALUES = [values.Inline, values.Block, values.None, values.Inherit];
// Display.INHERITED = false;

// var TextAlign = define('TextAlign', 'text-align');
// TextAlign.INITIAL = values.Left();
// TextAlign.VALUES = [values.Left, values.Center, values.Right, values.Inherit];
// TextAlign.INHERITED = true;

// var Color = define('Color', 'color');
// Color.INITIAL = values.Color(0, 0, 0);
// Color.VALUES = [values.Color, values.Inherit];
// Color.INHERITED = true;

// var FontSize = define('FontSize', 'font-size');
// FontSize.INITIAL = values.Length(16, 'px');
// FontSize.VALUES = [values.Percentage, values.Length, values.Inherit];
// FontSize.INHERITED = true;

// var LineHeight = define('LineHeight', 'line-height');
// LineHeight.INITIAL = values.Number(1.2);
// LineHeight.VALUES = [values.Number, values.Percentage, values.Length, values.Inherit];
// LineHeight.INHERITED = true;

// var Width = define('Width', 'width');
// Width.INITIAL = values.Auto();
// Width.VALUES = [values.Auto, values.Percentage, values.Length, values.Inherit];
// Width.INHERITED = false;

// var Height = define('Height', 'height');
// Height.INITIAL = values.Auto();
// Height.VALUES = [values.Auto, values.Percentage, values.Length, values.Inherit];
// Height.INHERITED = false;

// var BackgroundColor = define('BackgroundColor', 'background-color');
// BackgroundColor.INITIAL = values.Color(0, 0, 0, 0);
// BackgroundColor.VALUES = [values.Color, values.Inherit];
// BackgroundColor.INHERITED = false;

// var PaddingTop = define('PaddingTop', 'padding-top');
// var PaddingRight = define('PaddingRight', 'padding-right');
// var PaddingBottom = define('PaddingBottom', 'padding-bottom');
// var PaddingLeft = define('PaddingLeft', 'padding-left');

// PaddingTop.INITIAL = PaddingRight.INITIAL = PaddingBottom.INITIAL = PaddingLeft.INITIAL = values.Length(0, 'px');
// PaddingTop.VALUES = PaddingRight.VALUES = PaddingBottom.VALUES = PaddingLeft.VALUES = [values.Percentage, values.Length, values.Inherit];
// PaddingTop.INHERITED = PaddingRight.INHERITED = PaddingBottom.INHERITED = PaddingLeft.INHERITED = false;

// var MarginTop = define('MarginTop', 'margin-top');
// var MarginRight = define('MarginRight', 'margin-right');
// var MarginBottom = define('MarginBottom', 'margin-bottom');
// var MarginLeft = define('MarginLeft', 'margin-left');

// MarginTop.INITIAL = MarginRight.INITIAL = MarginBottom.INITIAL = MarginLeft.INITIAL = values.Length(0, 'px');
// MarginTop.VALUES = MarginRight.VALUES = MarginBottom.VALUES = MarginLeft.VALUES = [values.Percentage, values.Length, values.Inherit];
// MarginTop.INHERITED = MarginRight.INHERITED = MarginBottom.INHERITED = MarginLeft.INHERITED = false;

// // exports.Display = Display;
// // exports.TextAlign = TextAlign;
// // exports.Color = Color;
// // exports.FontSize = FontSize;
// // exports.LineHeight = LineHeight;
// // exports.Width = Width;
// // exports.Height = Height;
// // exports.BackgroundColor = BackgroundColor;

// // exports.PaddingTop = PaddingTop;
// // exports.PaddingRight = PaddingRight;
// // exports.PaddingBottom = PaddingBottom;
// // exports.PaddingLeft = PaddingLeft;

// // exports.MarginTop = MarginTop;
// // exports.MarginRight = MarginRight;
// // exports.MarginBottom = MarginBottom;
// // exports.MarginLeft = MarginLeft;

// module.exports = [
// 	Display,
// 	TextAlign,
// 	Color,
// 	FontSize,
// 	LineHeight,
// 	Width,
// 	Height,
// 	BackgroundColor,
// 	PaddingTop,
// 	PaddingRight,
// 	PaddingBottom,
// 	PaddingLeft,
// 	MarginTop,
// 	MarginRight,
// 	MarginBottom,
// 	MarginLeft
// ];
