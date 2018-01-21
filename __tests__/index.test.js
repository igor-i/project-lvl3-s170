import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import fs from 'mz/fs';
import pathlib from 'path';
import os from 'os';
import pageLoader, { makeFileNameFromURL, makeDirNameFromURL, getNewSrcLink } from '../src';

beforeAll(() => {
  axios.defaults.adapter = httpAdapter;
  nock.disableNetConnect();
});

test('#page and internal sources must be successfully loaded into files', async () => {
  const host = 'http://www.example.com/';
  const status = 200;

  const fileName = makeFileNameFromURL(host, '.html');
  const fixturesDir = '__tests__/__fixtures__';
  const body = fs.readFileSync(pathlib.join(fixturesDir, fileName), 'utf8');
  const tempDir = fs.mkdtempSync(pathlib.join(os.tmpdir(), 'foo-'));
  const srcLinkDir = 'srcs';
  const getLinkToSrcFile = srcFileName => `/${srcLinkDir}/${srcFileName}`;
  const srcDirName = makeDirNameFromURL(host);

  const mapingSrcFiles = {
    first: 'style.css',
    second: 'script._js',
    third: 'image.png',
  };

  nock(host)
    .get('/')
    .reply(status, body)
    .get(getLinkToSrcFile(mapingSrcFiles.first))
    .replyWithFile(status, pathlib.join(fixturesDir, getLinkToSrcFile(mapingSrcFiles.first)))
    .get(getLinkToSrcFile(mapingSrcFiles.second))
    .replyWithFile(status, pathlib.join(fixturesDir, getLinkToSrcFile(mapingSrcFiles.second)))
    .get(getLinkToSrcFile(mapingSrcFiles.third))
    .replyWithFile(status, pathlib.join(fixturesDir, getLinkToSrcFile(mapingSrcFiles.third)));

  await pageLoader(host, tempDir);
  const pathToFile = pathlib.resolve(tempDir, fileName);
  const data = fs.readFileSync(pathToFile, 'utf8');
  const expectedData = fs.readFileSync(pathlib.join(fixturesDir, 'expected.html'), 'utf8');

  expect(data).toBe(expectedData);

  const pathToSrcDir = pathlib.resolve(tempDir, srcDirName);
  const files = fs.readdirSync(pathToSrcDir)
    .filter(file => fs.statSync(pathlib.resolve(pathToSrcDir, file))
      .isFile());

  expect(files).toHaveLength(3);

  const getNewLinkToSrcFile = srcFileName =>
    pathlib.resolve(tempDir, getNewSrcLink(`${srcLinkDir}/${srcFileName}`, srcDirName));

  Object.keys(mapingSrcFiles).forEach((item) => {
    const itemData = fs.readFileSync(getNewLinkToSrcFile(mapingSrcFiles[item]), 'utf8');
    const itemExpectedData = fs.readFileSync(pathlib.join(fixturesDir, getLinkToSrcFile(mapingSrcFiles[item])), 'utf8');

    expect(itemData).toBe(itemExpectedData);
  });
});

test('#the page load should fails (Request failed with status code 404)', async () => {
  const host = 'http://www.example.com';
  const status = 404;
  const tempDir = fs.mkdtempSync(pathlib.join(os.tmpdir(), 'foo-'));

  nock(host).get('/').reply(status);

  try {
    await pageLoader(host, tempDir);
    expect(false).toBe(true);
  } catch (e) {
    expect(e.message).toMatch('Request failed with status code 404');
  }
});

test('#the page save into the file should fails (ENOENT: no such file or directory)', async () => {
  const host = 'http://www.example.com';
  const status = 200;
  const body = 'Hello world';
  const tempDir = pathlib.join(os.tmpdir(), 'foo-');
  const fileName = makeFileNameFromURL(host, '.html');
  const pathToFile = pathlib.resolve(tempDir, fileName);

  nock(host).get('/').reply(status, body);

  try {
    await pageLoader(host, tempDir);
    await fs.readFile(pathToFile, 'utf8');
    expect(false).toBe(true);
  } catch (e) {
    expect(e.message).toMatch('ENOENT: no such file or directory');
  }
});
