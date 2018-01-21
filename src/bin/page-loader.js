#!/usr/bin/env node

import commander from 'commander';
import pageLoader from '..';
import { version, description } from '../../package.json';
import errorHandling from '../errorHandler';

commander
  .version(version)
  .description(description)
  .option('-o, --output [path]', 'Output file path [path]')
  .arguments('<url>')
  .action((url, option) => {
    pageLoader(url, option.output)
      .catch((error) => {
        const errorMessage = errorHandling(error);
        console.error(errorMessage);
        if (error.config) {
          console.error(error.config);
        }
        process.exit(1);
      });
  })
  .parse(process.argv);
