var ElementType = require('domelementtype');

var values = require('./css/values');
var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var LineBreakBox = require('./layout/line-break-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');
var ImageBox = require('./layout/image-box');

var None = values.Keyword.None;
var Block = values.Keyword.Block;
var Inline = values.Keyword.Inline;
var LineBreak = values.Keyword.LineBreak;

var isInlineLevelBox = function(box) {
	return box instanceof InlineBox ||
		box instanceof TextBox ||
		box instanceof LineBreakBox ||
		box instanceof ImageBox.Inline;
};

var isInlineContainerBox = function(box) {
	return box instanceof InlineBox ||
		box instanceof LineBox;
};

var isBlockLevelBox = function(box) {
	return box instanceof Viewport ||
		box instanceof LineBox ||
		box instanceof BlockBox ||
		box instanceof ImageBox.Block;
};

var isBlockContainerBox = function(box) {
	return box instanceof Viewport ||
		box instanceof BlockBox;
};

var branch = function(ancestor, descedant) {
	var first, current;

	while(descedant !== ancestor) {
		var d = descedant.clone();
		descedant.addLink(d);

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

			if(None.is(display)) {
				return;
			} else if(node.name === 'img') {
				var image = node.image;

				if(Block.is(display)) box = new ImageBox.Block(parent, style, image);
				else box = new ImageBox.Inline(parent, style, image);
			} else if(Inline.is(display)) {
				box = new InlineBox(parent, style);
			} else if(Block.is(display)) {
				box = new BlockBox(parent, style);
			} else if(LineBreak.is(display)) {
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

	var isInline = isInlineContainerBox(parent);
	var resume;

	boxes.forEach(function(child) {
		var isBlock = isBlockLevelBox(child);
		var box;

		if(isInline && isBlock) {
			box = child.clone(ancestor);
			parent = branch(ancestor, parent);
			resume = parent.parent;
		} else {
			box = child.cloneWithLinks(parent);
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

			box = child.cloneWithLinks(line);
		} else {
			line = null;
			box = child.cloneWithLinks(parent);
		}

		if(child.children) lines(box, child.children);
	});
};

module.exports = function(html, viewport) {
	viewport = new Viewport(viewport.position, viewport.dimensions);

	build(viewport, html);

	viewport = [
		blocks,
		lines
	].reduce(function(acc, fn) {
		var a = acc.clone();
		fn(a, acc.children);
		return a;
	}, viewport);

	viewport.layout();

	return viewport;
};
