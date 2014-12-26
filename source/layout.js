var ElementType = require('domelementtype');

var values = require('./css/values');
var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var LineBreakBox = require('./layout/line-break-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');

var None = values.Keyword.None;
var Block = values.Keyword.Block;
var Inline = values.Keyword.Inline;
var LineBreak = values.Keyword.LineBreak;

var isInlineLevelBox = function(box) {
	return box instanceof InlineBox ||
		box instanceof TextBox ||
		box instanceof LineBreakBox;
};

var isBlockLevelBox = function(box) {
	return box instanceof Viewport ||
		box instanceof LineBox ||
		box instanceof BlockBox;
};

var isBlockContainerBox = function(box) {
	return box instanceof Viewport ||
		box instanceof BlockBox;
};

var branch = function(ancestor, descedant) {
	var first, current;

	while(descedant !== ancestor) {
		var d = descedant.clone();

		if(current) d.attach(current);
		if(!first) first = d;

		current = d;

		if(!descedant.parent) throw new Error('No ancestor match');
		descedant = descedant.parent;
	}

	if(current) ancestor.attach(current);
	return first;
};

var build = function(parent, nodes) {
	nodes.forEach(function(node) {
		var box;

		if(ElementType.isTag(node)) {
			var style = node.style;
			var display = style.display;

			if(None.is(display)) return;
			if(Inline.is(display)) {
				box = new InlineBox(parent, style);
			}
			if(Block.is(display)) {
				box = new BlockBox(parent, style);
			}
			if(LineBreak.is(display)) {
				box = new LineBreakBox(parent, style);
			}

			build(box, node.childNodes);
		} else if(node.type === ElementType.Text) {
			box = new TextBox(parent, node.data);
		}

		if(box) parent.children.push(box);
	});
};

var blocks = function(parent, boxes, ancestor) {
	ancestor = ancestor || parent;

	var isInline = isInlineLevelBox(parent);
	var resume;

	boxes.forEach(function(child) {
		var isBlock = isBlockLevelBox(child);
		var box;

		if(isInline && isBlock) {
			box = child.clone(ancestor);
			parent = branch(ancestor, parent);
			resume = parent.parent;
		} else {
			box = child.clone(parent);
		}

		if(child.children) {
			var a = isBlockContainerBox(box) ? box : ancestor;
			parent = blocks(box, child.children, a) || parent;
		}
	});

	return resume;
};

var lines = function(parent, boxes) {
	var isBlock = isBlockContainerBox(parent);
	var line;

	boxes.forEach(function(child) {
		var isInline = isInlineLevelBox(child);
		var box;

		if(isBlock && isInline) {
			if(!line) {
				line = new LineBox(parent);
				parent.children.push(line);
			}

			box = child.clone(line);
		} else {
			line = null;
			box = child.clone(parent);
		}

		if(child.children) lines(box, child.children);
	});
};

var collapseWhitespace = function(parent, boxes, strip) {
	boxes.forEach(function(child) {
		var box;

		if(child instanceof LineBox) {
			if(child.isCollapsibleWhitespace()) return;
			strip = false;
		}

		if(child instanceof TextBox) {
			box = child.collapseWhitespace(parent, strip);
			strip = child.endsWithCollapsibleWhitespace();
		} else {
			box = child.clone(parent);
		}

		if(child.children) strip = collapseWhitespace(box, child.children, strip);
	});

	return strip;
};

var breaks = function(parent, boxes, ancestor) {
	ancestor = ancestor || parent;

	var resume;

	boxes.forEach(function(child) {
		var isBreak = child instanceof LineBreakBox;
		var box;

		if(isBreak) {
			parent = branch(ancestor, parent);
			resume = parent.parent;
		} else {
			box = child.clone(parent);
		}

		if(box && child.children) {
			var a = isBlockContainerBox(box) ? box : ancestor;
			parent = breaks(box, child.children, a) || parent;
		}
	});

	return resume;
};

module.exports = function(html, viewport, context) {
	viewport = new Viewport(viewport.position, viewport.dimensions);

	build(viewport, html);

	viewport = [
		blocks,
		lines,
		collapseWhitespace,
		breaks,
	].reduce(function(acc, fn) {
		var a = acc.clone();
		fn(a, acc.children);
		return a;
	}, viewport);

	viewport.layout();

	return viewport;
};
