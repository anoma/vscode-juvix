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

import { window } from 'vscode';

export async function juvixIsNotInstalled() {
  const juvixVer = 'Juvix-v' + supportedVersion;

  const result = await window.showWarningMessage(
    `It appears that Juvix is not installed. To proceed,
    you require version ${juvixVer} or a newer version.
    Please confirm the binary path on the user settings page.
    Alternatively, we can install it for you now.
    Would you like to proceed with the installation?`,
    'Install',
    'Show recommendations'
  );

  if (result === 'Install') {
    await installJuvix();
  } else {
    // open the docs
    logger.warn(
      'Check the binary path in the configuration page or ' +
        `visit [https://docs.juvix.org/${juvixVer}/howto/installing/](https://docs.juvix.org/${juvixVer} /howto/installing/) for instructions.`
    );
  }
}

export async function checkJuvixBinary(): Promise<string> {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--version']);
  if (ls.status !== 0) await juvixIsNotInstalled();
  return ls.stdout.toString().replace('version ', 'v').split('\n')[0];
}

export function getInstalledNumericVersion(): string | undefined {
  const config = new JuvixConfig();
  const ls = spawnSync(config.getJuvixExec(), ['--numeric-version']);
  if (ls.status == 0) return ls.stdout.toString().split('\n')[0];
  else juvixIsNotInstalled();
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

export async function checkForUpgrade(version: string) {
  if (!isJuvixVersionSupported()) {
    window
      .showWarningMessage(
        `Juvix ${version} is not supported. Do you want to upgrade to the latest version?`,
        'Upgrade',
        'No'
      )
      .then(result => {
        if (result === 'Upgrade') {
          installJuvix();
          return getInstalledNumericVersion();
        } else {
          logger.warn(
            'Please upgrade Juvix to the latest version. Visit https://docs.juvix.org/latest/howto/installing/ for instructions.'
          );
        }
      });
  }
}
