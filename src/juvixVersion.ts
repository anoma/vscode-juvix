/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import { logger } from './utils/debug';
import { JuvixConfig } from './config';
import * as versioning from 'compare-versions';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { installJuvix } from './installer';

const ERROR_JUVIX_NOT_INSTALLED = [
  'Juvix binary is not installed. Please check the binary path in the',
  'configuration page or the instructions on',
  'https://docs.juvix.org/howto/installing.html',
].join(' ');

import { window } from 'vscode';

export async function juvixIsNotInstalled() {
  const result = await window.showWarningMessage(
    'Juvix is not installed. Do you want to install it now?',
    'Yes',
    'No'
  );
  if (result === 'Yes') {
    await installJuvix();
  } else {
    logger.error(ERROR_JUVIX_NOT_INSTALLED);
  }
}

export async function getInstalledFullVersion(): Promise<string | undefined> {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--version']);

  if (ls.status !== 0) {
    await juvixIsNotInstalled();
    return;
  }
  return ls.stdout.toString().replace('version ', 'v').split('\n')[0];
}

export function getInstalledNumericVersion(): string | undefined {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--numeric-version']);
  if (ls.status == 0) return ls.stdout.toString().split('\n')[0];
  juvixIsNotInstalled();
}

export const supportedVersion: string = fs
  .readFileSync(path.join(__dirname, '..', 'juvix.version'), 'utf8')
  .trim();

export function isJuvixVersionSupported(): boolean {
  const installedVersion = getInstalledNumericVersion();
  return installedVersion
    ? versioning.satisfies(installedVersion, `>=${supportedVersion}`)
    : false;
}

export async function upgradeJuvix() {
  const version = getInstalledFullVersion();
  if (!isJuvixVersionSupported()) {
    const result = await window.showQuickPick(['Yes', 'No'], {
      placeHolder: `${version} is not supported. Do you want to upgrade to the latest version?`,
    });
    if (result === 'Yes') {
      await installJuvix();
    } else {
      logger.error(
        'Please upgrade Juvix to the latest version. Visit https://docs.juvix.org/howto/installing.html for instructions.'
      );
    }
  }
}
