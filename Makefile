.PHONY: build clean test-build test-watch dist/test

build: dist
	browserify source/index.js -o dist/index.js

clean:
	rm -rf dist

test-build: dist/test dist/test/index.html
	browserify test/index.js -o dist/test/index.js

test-watch: dist/test dist/test/index.html
	onchange test/index.html -- /bin/sh -c 'make dist/test/index.html' &\
	watchify test/index.js -v -d -o dist/test/index.js &\
	node server.js

dist:
	mkdir -p dist

dist/test:
	rm -rf dist/test
	mkdir -p dist/test

dist/test/index.html: test/index.html
	cp test/index.html dist/test/index.html
