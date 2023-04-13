/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';

import { debugChannel } from './utils/debug';
import * as user from './config';
import * as utils from './utils/base';
import * as versioning from 'compare-versions';
import * as fs from 'fs';
import * as path from 'path';

const ERROR_JUVIX_NOT_INSTALLED =
  'Juvix binary is not installed. Please check the binary path in the configuration page or the instructions on https://docs.juvix.org/howto/installing.html';

export function getInstalledFullVersion(): string | undefined {
  const config = new user.JuvixConfig();
  const { spawnSync } = require('child_process');
  const ls = spawnSync(config.getJuvixExec(), ['--version']);
  let execJuvixVersion: string;
  if (ls.status !== 0) {
    debugChannel.error(ERROR_JUVIX_NOT_INSTALLED);
    return;
  } else {
    execJuvixVersion = ls.stdout.toString().replace('version ', 'v');
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    return juvixBinaryVersion;
  }
}

export function getInstalledNumericVersion(): string | undefined {
  const config = new user.JuvixConfig();
  const { spawnSync } = require('child_process');
  const ls = spawnSync(config.getJuvixExec(), ['--numeric-version']);
  let execJuvixVersion: string;
  if (ls.status !== 0) {
    debugChannel.error(ERROR_JUVIX_NOT_INSTALLED);
    return;
  } else {
    execJuvixVersion = ls.stdout.toString().split('\n')[0];
    return execJuvixVersion;
  }
}

export const supportedVersion: string = fs
  .readFileSync(path.join(__dirname, '..', 'juvix.version'), 'utf8')
  .trim();

export function isJuvixVersionSupported(): boolean {
  // Read Juvix version from file juvix.version
  const installedVersion = getInstalledNumericVersion();
  if (installedVersion) {
    debugChannel.info('Juvix version installed: ' + installedVersion);
    debugChannel.info('Juvix version supported: ' + supportedVersion);
    return versioning.satisfies(installedVersion, '>=' + supportedVersion);
  } else {
    return false;
  }
}
