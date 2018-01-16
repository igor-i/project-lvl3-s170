install:
	npm install

build:
	npm run build

test:
	npm test

start:
	npm run babel-node -- src/bin/page-loader.js --output tmp/temp https://hexlet.io/courses
	# npm run babel-node -- src/bin/page-loader.js https://hexlet.io/courses

publish:
	npm publish

lint:
	npm run eslint .
