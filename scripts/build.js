// Copyright (c) 2017, The Linux Foundation. All rights reserved.
// SPDX-License-Identifier: MIT

const yaml = require('js-yaml');
const fs = require('fs');
const {log} = require('console');
const git = require('simple-git/promise')(__dirname);

const ERROR = 1;
const isCLI = require.main === module;
const colors = {
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};
const TRAVIS_BRANCH = process.env.TRAVIS_BRANCH

function failure(error = 'Error') {
  log(colors.red, `${error}`);
  process.exitCode = ERROR;
  return ERROR;
}

function loadYamlFile(path) {
  try {
    let data = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    return {data, path};
  } catch (error) {
    return failure(`Invalid yaml file: ${path}\n`);
  }
}

function logYamlDoc({data, path}) {
  log(colors.cyan, path);
  yaml.safeDump(data).split('\n').forEach(line => log(colors.green, line));
}

function isCurationFile(path) {
  return path.startsWith('curations/')
    && (path.endsWith('.yml') || path.endsWith('.yaml'));
}

async function getAddedAndChangedYamls(commitRange = `HEAD...${TRAVIS_BRANCH}`) {
  let yamls = [];

  try {
    let paths = await git.raw([
      'diff',
      '--name-only',
      '--diff-filter=AM',
      commitRange
    ]);
    yamls = paths ? paths.split('\n').filter(isCurationFile) : [];
  } catch (error) {
    failure(`Git error: ${error}`)
  }

  return yamls;
}

function processCurations(yamls) {
  log('added', process.env.ADDED_CHANGED_FILES);
  log('travisbranch', process.env.TRAVIS_BRANCH);

  if (!yamls.length) {
    return failure('0 yaml files');
  }

  let docs = yamls.map(loadYamlFile).filter(x => x !== ERROR);
  if (docs.length) {
    log(colors.yellow, 'Valid yaml files:');
  }
  docs.forEach(logYamlDoc);
}

function run() {
  getAddedAndChangedYamls('').then(processCurations);
}

if (isCLI) {
  run();
}
