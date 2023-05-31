/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import { logger } from './utils/debug';
import { JuvixConfig } from './config';
import * as versioning from 'compare-versions';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const ERROR_JUVIX_NOT_INSTALLED = [
  'Juvix binary is not installed. Please check the binary path in the',
  'configuration page or the instructions on',
  'https://docs.juvix.org/howto/installing.html'
].join(' ');

export function getInstalledFullVersion(): string | undefined {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--version']);

  if (ls.status !== 0) {
    logger.error(ERROR_JUVIX_NOT_INSTALLED);
    return;
  }

  return ls.stdout.toString().replace('version ', 'v').split('\n')[0];
}

export function getInstalledNumericVersion(): string | undefined {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--numeric-version']);
  if (ls.status !== 0) {
    logger.error(ERROR_JUVIX_NOT_INSTALLED);
    return;
  }
  return ls.stdout.toString().split('\n')[0];
}

export const supportedVersion: string = fs
  .readFileSync(path.join(__dirname, '..', 'juvix.version'), 'utf8')
  .trim();

export function isJuvixVersionSupported(): boolean {
  const installedVersion = getInstalledNumericVersion();
  return installedVersion ? versioning.satisfies(installedVersion, `>=${supportedVersion}`) : false;
}
