# repaint

A HTML layout engine written in Javascript. Takes HTML as input, renders it and outputs an image.

Parses HTML, CSS, combines them and then calculates position and dimensions of all elements. It's essentially the same as your browser's rendering engine.

[http://kapetan.github.io/repaint-chrome/examples/wiki.html][wiki]

# Why?

3 years ago [@devongovett](http://twitter.com/devongovett) joked around with a [script](http://badassjs.com/post/20294238453/webkit-js-yes-it-has-finally-happened-browser) he created that could render HTML in the browser so that it would look the same in all browsers.

In August I happened to run into a [post](http://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html) by [Matt Brubeck](http://limpet.net/mbrubeck/) who wanted to do a browser engine, and it got me thinking. So I started working on this project around that time, and I now think it's ready to be judged by others.

There are still a lot of functionalities missing, but it is able to render some basic HTML. Right now it only works in the browser, but might be made to run in a node environment with some modifications.

# Installation

	npm install repaint

The module tries to follow the [CSS 2.1][css21] specification.

# Examples

The [repaint-chrome][rc] repository provides a simple interface for editing and rendering markdown and HTML using `repaint`. The markdown is rendered by first converting it to plain HTML.

- [kapetan/text-width][tw] markdown formatted readme
- [mafintosh/peerflix][pf] markdown formatted readme with images
- [Marcus Tullius Tiro][wiki] wikipedia mobile page. It's not possible to render arbitrary wikipedia pages since `repaint` doesn't support CSS shorthand properties.
- [Repaint test page][test]. Simple test page presenting the HTML rendered by `repaint` on the left and an iframe with the same HTML on the right.

# Usage

The module exposes a rendering function which accepts an options object and a callback. The `content`, `context` and `viewport.dimensions.width` options are required, and should respectively provide the HTML content as a string, the canvas 2d context used for drawing and the initial viewport width.

Additionally the `url` is used to resolve any resources linked in the HTML (images and stylesheet links), also `viewport.position` specifies the initial viewport offset, e.g. a position of `{ x: 0, y: -10 }` would correspond to scrolling the page down 10 pixels.

Require the module with `browserify` or a similar tool.

```javascript
var repaint = require('repaint');

repaint({
	url: '' + window.location,
	content: '<html><body>Hello</body></html>',
	context: canvas.getContext('2d'),
	viewport: {
		position: { x: 0, y: 0 },
		dimensions: { width: 512, height: 1024 }
	}
}, function(err, page) {
	if(err) throw err;
	console.log(page);
});
```

The resulting `page` object contains some rendering details, like the parsed HTML (`page.document`) and the layout tree (`page.layout`).

The provided content is first parsed using the [htmlparser2][htmlparser2] module, and all stylesheets, including style attributes, are parsed with [css][css] and matched to HTML nodes with [css-select][css-select]. Before drawing the HTML the layout tree is constructed. Each node in the tree has the absolute position and dimensions calculated, and the text content is laid out according to the specification (e.g. each text line is contained in a line box).

There is no default stylesheet included, so all css properties fallback to their default values. This also means that everything in the `head` tag will be visible unless explicitly hidden.

# Issues

At the moment only normal flow is implemented, and without support for CSS shorthand properties (e.g. `padding: 10px;`), lists and tables.

Follows a non-exhaustive list of missing functionallity.

- CSS shorthand properties
- Collapsing margins
- Background images
- Inline blocks
- Support for more vertical align values
- Text decoration and align
- Lists and counter properties (`counter-reset` and `counter-increment`)
- Tables
- Pseudo elements, `:before`, `:after` and the `content` property
- `overflow` property
- `float` and `clear` property
- `position` property
- CSS media types (`@media` rule)
- Rounded corners (CSS3 functionallity, but would be nice to have)

[rc]: https://github.com/kapetan/repaint-chrome
[test]: http://kapetan.github.io/repaint/dist/test/index.html
[css21]: http://www.w3.org/TR/2011/REC-CSS2-20110607
[htmlparser2]: https://github.com/fb55/htmlparser2
[css]: https://github.com/reworkcss/css
[css-select]: https://github.com/fb55/css-select

[tw]: http://kapetan.github.io/repaint-chrome/examples/text-width.html
[pf]: http://kapetan.github.io/repaint-chrome/examples/peerflix.html
[wiki]: http://kapetan.github.io/repaint-chrome/examples/wiki.html
