import pathlib from 'path';
import urllib from 'url';
import axios from 'axios';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';

const log = debug('page-loader:');
const appName = 'Page Loader';
log('booting %o', appName);

const errorHandling = (error) => {
  log('task completed with error %o', error.message);
  console.log(`ERROR: ${error.message}`);
};

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

const makeSrcDir = (pathToSrcDir, html) => {
  log('making sources directory %o', pathToSrcDir);
  return fs.mkdir(pathToSrcDir)
    .then(() => {
      log('successfully');
      return html;
    });
};

const mapingTypeSrcLinks = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getSrcLinks = (html) => {
  log('getting sources links');
  const $ = cheerio.load(html);
  const srcLinks = _.union(_.flatten(Object.keys(mapingTypeSrcLinks).map(typeSrc => $(typeSrc)
    .map((index, element) => ($(element).attr(mapingTypeSrcLinks[typeSrc])))
    .get())));
  log('successfully, count of links: %o', srcLinks.length);

  return { srcLinks, html };
};

const loadAndWriteSrcFiles = (srcLinks, pathToSrcDir, url, html) => {
  log('start asynchronous loading and writing sources files');
  return axios.all(srcLinks.map((srcLink) => {
    const { host } = urllib.parse(srcLink);
    if (host) {
      log('external reference %o discarded', host);
      return true;
    }
    const pathname = `${url.pathname}${srcLink}`;
    const srcUrl = urllib.format({ ...url, pathname });
    const axiosParams = { method: 'get', url: srcUrl, responseType: 'stream' };
    log('loading a file %o', srcLink);
    return axios.all([makeFileNameFromURL(srcLink), axios(axiosParams)])
      .then(axios.spread((newFileName, response) => {
        log('successfully writed file into %o', newFileName);
        return response.data.pipe(fs.createWriteStream(pathlib.resolve(pathToSrcDir, newFileName)));
      }));
  }))
    .then(() => {
      log('end asynchronous loading and writing source files');
      return html;
    });
};

const getNewSrcLink = (link, pathToSrcDir) => {
  if (link === undefined) {
    return null;
  }
  const { host } = urllib.parse(link);
  return host ? link : pathlib.join(pathToSrcDir, makeFileNameFromURL(link));
};

const changeHtml = (pathToSrcDir, html) => {
  log('changing HTML file');
  const $ = cheerio.load(html);
  Object.keys(mapingTypeSrcLinks).forEach(typeSrc => $(typeSrc)
    .attr(mapingTypeSrcLinks[typeSrc], (item, value) => getNewSrcLink(value, pathToSrcDir)));
  log('successfully');

  return $.html();
};

const writeNewHtml = (pathToHtmlFile, newHtml) => {
  log('writing changed HTML file');
  return fs.writeFile(pathToHtmlFile, newHtml, 'utf8')
    .then(() => log('successfully'));
};

const pageLoader = (link, pathToDir = './') => {
  const srcDirName = makeDirNameFromURL(link);
  const pathToSrcDir = pathlib.join(pathToDir, srcDirName);
  const htmlFileName = makeFileNameFromURL(link, '.html');
  const pathToHtmlFile = pathlib.resolve(pathToDir, htmlFileName);
  const url = urllib.parse(link);

  log('loading %o', link);
  return axios.get(link)
    .then((response) => {
      log('successfully');
      return response.data;
    })
    .then(html => makeSrcDir(pathToSrcDir, html))
    .then(html => getSrcLinks(html))
    .then(({ srcLinks, html }) => loadAndWriteSrcFiles(srcLinks, pathToSrcDir, url, html))
    .then(html => changeHtml(srcDirName, html))
    .then(newHtml => writeNewHtml(pathToHtmlFile, newHtml))
    .then(() => log('task completed successfully'))
    .catch(error => errorHandling(error));
};

export { makeFileNameFromURL, makeDirNameFromURL, getNewSrcLink };
export default pageLoader;
