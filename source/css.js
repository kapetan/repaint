var ElementType = require('domelementtype');

var declarations = require('./css/declarations');
var cascade = require('./css/cascade');
var compute = require('./css/compute');

module.exports = function(stylesheets, html) {
	var stack = [html];

	while(stack.length) {
		var nodes = stack.pop();

		nodes.forEach(function(node) {
			if(ElementType.isTag(node)) {
				var style = cascade(stylesheets, node);
				var parentStyle = node.parentNode && node.parentNode.style;

				node.style = compute(style, parentStyle);
			}

			if(node.childNodes) stack.push(node.childNodes);
		});
	}
};
