install:
	npm install

build:
	npm run build

test:
	npm test

start:
	npm run babel-node -- src/bin/page-loader.js

publish:
	npm publish

lint:
	npm run eslint .
