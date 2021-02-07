#!/usr/bin/env node

'use strict';

function errorHandler(error, source) {
    // eslint-disable-next-line no-console
  console.error(`${source}:
  name: ${error.name},
  message: ${error.message},
  stack: ${error.stack}`);
};

module.exports = { errorHandler: errorHandler };
