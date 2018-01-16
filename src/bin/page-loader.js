#!/usr/bin/env node

import commander from 'commander';
import pageLoader from '..';
import { version, description } from '../../package.json';

commander
  .version(version)
  .description(description)
  .option('-o, --output [path]', 'Output file path [path]')
  .arguments('<url>')
  .action((url, option) => {
    pageLoader(url, option.output);
  })
  .parse(process.argv);
