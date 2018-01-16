import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import fs from 'mz/fs';
import pathlib from 'path';
import os from 'os';
import pageLoader, { makeFileNameFromURL } from '../src';

axios.defaults.adapter = httpAdapter;
nock.disableNetConnect();

test('#the page should load successfully into the file', () => {
  const host = 'http://www.example.com';
  const status = 200;
  const body = 'Hello world';
  const tempDir = fs.mkdtempSync(os.tmpdir());
  const fileName = makeFileNameFromURL(host);
  const pathToFile = pathlib.resolve(tempDir, fileName);

  nock(host).get('/').reply(status, body);

  expect.assertions(1);

  return pageLoader(host, tempDir)
    .then(() => fs.readFile(pathToFile, 'utf8'))
    .then(data => expect(data).toBe(body));
});

test('#the page load should fails (Request failed with status code 404)', () => {
  const host = 'http://www.example.com';
  const status = 404;
  const tempDir = fs.mkdtempSync(os.tmpdir());

  nock(host).get('/').reply(status);

  expect.assertions(1);

  return pageLoader(host, tempDir)
    .catch((e) => {
      expect(e.message).toMatch('Request failed with status code 404');
    });
});

test('#the page save into the file should fails (ENOENT: no such file or directory)', () => {
  const host = 'http://www.example.com';
  const status = 200;
  const body = 'Hello world';
  const tempDir = fs.mkdtempSync(os.tmpdir());
  const fileName = 'wrong-file-name.wrong';
  const pathToFile = pathlib.resolve(tempDir, fileName);

  nock(host).get('/').reply(status, body);

  expect.assertions(1);

  return pageLoader(host, tempDir)
    .then(() => fs.readFile(pathToFile, 'utf8'))
    .catch((e) => {
      expect(e.message).toMatch('ENOENT: no such file or directory');
    });
});
