install:
	npm install

build:
	npm run build

test:
	npm test

start:
	npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://ru.hexlet.io/courses

publish:
	npm publish

lint:
	npm run eslint .
