import pathlib from 'path';
import urllib from 'url';
import axios from 'axios';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import _ from 'lodash';

const errorHandling = error => console.log(`ERROR: ${error.message}`);

const makeNameFromURL = (link) => {
  const { host, path, hash } = urllib.parse(link);
  return [host, path, hash].join('').replace(/[^a-zA-Z]/gi, '-');
};

const makeFileNameFromURL = (link, extension) => {
  const { ext } = pathlib.parse(link);
  const fileExt = (extension || ext);
  const fileName = `${makeNameFromURL(link)}${fileExt}`;
  return fileName;
};

const makeDirNameFromURL = link => `${makeNameFromURL(link)}_files`;

const makeSrcDir = (pathToSrcDir, html) =>
  fs.mkdir(pathToSrcDir)
    .then(() => html);

const mapingTypeSrcLinks = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getSrcLinks = (html) => {
  const $ = cheerio.load(html);
  const srcLinks = _.union(_.flatten(Object.keys(mapingTypeSrcLinks).map(typeSrc => $(typeSrc)
    .map((index, element) => ($(element).attr(mapingTypeSrcLinks[typeSrc])))
    .get())));

  return { srcLinks, html };
};

const loadAndWriteSrcFiles = (srcLinks, pathToSrcDir, url, html) =>
  axios.all(srcLinks.map((srcLink) => {
    const { host } = urllib.parse(srcLink);
    if (host) {
      return true;
    }
    const pathname = `${url.pathname}${srcLink}`;
    const srcUrl = urllib.format({ ...url, pathname });
    const axiosParams = { method: 'get', url: srcUrl, responseType: 'stream' };
    return axios.all([makeFileNameFromURL(srcLink), axios(axiosParams)])
      .then(axios.spread((newFileName, response) =>
        response.data.pipe(fs.createWriteStream(pathlib.resolve(pathToSrcDir, newFileName)))));
  })).then(() => html);

const getNewSrcLink = (link, pathToSrcDir) => {
  if (link === undefined) {
    return null;
  }
  const { host } = urllib.parse(link);
  return host ? link : pathlib.join(pathToSrcDir, makeFileNameFromURL(link));
};

const changeHtml = (pathToSrcDir, html) => {
  const $ = cheerio.load(html);
  Object.keys(mapingTypeSrcLinks).forEach(typeSrc => $(typeSrc)
    .attr(mapingTypeSrcLinks[typeSrc], (item, value) => getNewSrcLink(value, pathToSrcDir)));

  return $.html();
};

const writeNewHtml = (pathToHtmlFile, newHtml) =>
  fs.writeFile(pathToHtmlFile, newHtml, 'utf8');

const pageLoader = (link, pathToDir = './') => {
  const srcDirName = makeDirNameFromURL(link);
  const pathToSrcDir = pathlib.join(pathToDir, srcDirName);
  const htmlFileName = makeFileNameFromURL(link, '.html');
  const pathToHtmlFile = pathlib.resolve(pathToDir, htmlFileName);
  const url = urllib.parse(link);

  return axios.get(link)
    .then(response => response.data)
    .then(html => makeSrcDir(pathToSrcDir, html))
    .then(html => getSrcLinks(html))
    .then(({ srcLinks, html }) => loadAndWriteSrcFiles(srcLinks, pathToSrcDir, url, html))
    .then(html => changeHtml(srcDirName, html))
    .then(newHtml => writeNewHtml(pathToHtmlFile, newHtml))
    .catch(error => errorHandling(error));
};

export { makeFileNameFromURL, makeDirNameFromURL, getNewSrcLink };
export default pageLoader;
