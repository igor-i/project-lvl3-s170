install:
	npm install

build:
	npm run build

test:
	DEBUG=page-loader:* npm test

start:
	rm -rf tmp/temp
	mkdir tmp/temp
	npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://ru.hexlet.io/courses

publish:
	npm publish

lint:
	npm run eslint .
