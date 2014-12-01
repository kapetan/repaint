var ElementType = require('domelementtype');

var values = require('./css/values');
var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');

var None = values.Keyword.None;
var Block = values.Keyword.Block;
var Inline = values.Keyword.Inline;

var getInlineLevelBoxParent = function(parent) {
	if(parent instanceof BlockBox || parent instanceof Viewport) {
		var line = parent.children[parent.children.length - 1];
		if(!(line instanceof LineBox)) {
			line = new LineBox(parent);
			parent.children.push(line);
		}

		return line;
	}

	return parent;
};

var getBlockContainerBoxAncestor = function(parent) {
	var ancestor = parent;
	var path = [];

	while(!(ancestor instanceof BlockBox) && !(ancestor instanceof Viewport)) {
		path.push(ancestor);
		ancestor = ancestor.parent;
	}

	return [ancestor, path];
};

var createBlockBox = function(parent, node, style) {
	if(parent instanceof BlockBox || parent instanceof Viewport) {
		var box = new BlockBox(parent, style);
		parent.children.push(box);

		return [parent, box];
	} else if(parent instanceof LineBox || parent instanceof InlineBox) {
		var block = getBlockContainerBoxAncestor(parent);
		var ancestor = block[0];
		var path = block[1];

		var box = new BlockBox(ancestor, style);
		ancestor.children.push(box);

		var clone = path.reduceRight(function(acc, seg) {
			return seg.clone(acc);
		}, ancestor);

		return [clone, box];
	}
};

var createInlineBox = function(parent, node, style) {
	var inline = getInlineLevelBoxParent(parent);
	var box = new InlineBox(inline, style);
	inline.children.push(box);

	return [parent, box];
};

var createTextBox = function(parent, node) {
	var inline = getInlineLevelBoxParent(parent);
	var box = new TextBox(inline, node.data);
	inline.children.push(box);
};

var build = function(parent, resume, nodes) {
	nodes.forEach(function(node) {
		var box;

		if(ElementType.isTag(node)) {
			var style = node.style;
			var display = style.display;

			if(None.is(display)) return;
			if(Inline.is(display)) {
				var inline = createInlineBox(parent, node, style);
				parent = inline[0], box = inline[1];
			}
			if(Block.is(display)) {
				var block = createBlockBox(parent, node, style);
				parent = block[0], box = block[1];
				resume = parent.parent;
			}

			parent = build(box, parent, node.childNodes);
		} else if(node.type === ElementType.Text) {
			createTextBox(parent, node);
		}
	});

	return resume;
};

module.exports = function(html, viewport, context) {
	viewport = new Viewport(viewport.position, viewport.dimensions);
	build(viewport, viewport, html);

	viewport.collapseWhitespace();
	viewport.layout();

	return viewport;
};
