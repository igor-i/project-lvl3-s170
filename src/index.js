import pathlib from 'path';
import url from 'url';
import axios from 'axios';
import fs from 'mz/fs';

export const makeFileNameFromURL = (link) => {
  const { host, path, hash } = url.parse(link);
  const newstr = [host, path, hash].join('').replace(/[^a-zA-Z]/gi, '-');
  return `${newstr}.html`;
};

export default (link, pathToDir = './') => {
  const fileName = makeFileNameFromURL(link);
  const pathToFile = pathlib.resolve(pathToDir, fileName);
  return axios.get(link)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
      return response.data;
    })
    .then(html => fs.writeFile(pathToFile, html, 'utf8'));
};
