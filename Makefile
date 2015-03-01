.PHONY: build clean test-build test-watch test-copy test-clean

build: dist
	browserify source/index.js -o dist/index.js

clean:
	rm -rf dist

test-build: test-clean test-copy
	browserify test/index.js -t brfs -o dist/test/index.js

test-watch: test-clean test-copy
	onchange test/index.html -- /bin/sh -c 'make test-copy' &\
	watchify test/index.js -v -d -t brfs -o dist/test/index.js &\
	node server.js

test-copy: dist/test/index.html dist/test/css dist/test/images

test-clean:
	rm -rf dist/test

dist:
	mkdir -p dist

dist/test:
	mkdir -p dist/test

dist/test/index.html: dist/test test/index.html
	cp test/index.html dist/test/index.html

dist/test/css: dist/test test/assets/css/*
	rm -rf dist/test/css
	cp -r test/assets/css dist/test/css

dist/test/images: dist/test test/assets/images/*
	rm -rf dist/test/images
	cp -r test/assets/images dist/test/images
