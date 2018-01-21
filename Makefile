install:
	npm install

build:
	npm run build

test:
	npm test

debug:
	DEBUG=page-loader:* npm test

start:
	rm -rf tmp/temp
	mkdir tmp/temp
	# npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://ru.hexlet.io/courses
	# npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://habrahabr.ru/sandbox/72340/
	npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://shop.igor-i.ru/

publish:
	npm publish

lint:
	npm run eslint .
