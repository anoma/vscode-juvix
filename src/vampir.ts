/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import { window } from 'vscode';
import { config } from './config';
import { installVampir } from './installer';
import { logger } from './utils/debug';
import { spawnSync } from 'child_process';

export async function vampirIsNotInstalled() {
  const vampirUrl = 'https://github.com/anoma/vamp-ir';
  const vampirLink = `[VampIR](${vampirUrl})`;

  const result = await window.showWarningMessage(
    `It appears that VampIR is not installed. To have access to all features of
    the extention, including VampIR compilation,
    you require to install ${vampirLink}.
    Please confirm the binary path on the user settings page.

    Alternatively, we can install it for you now.
    Would you like to proceed with the installation?`,
    'Install',
    'Show recommendations'
  );

  if (result === 'Install') {
    await installVampir();
  } else {
    logger.warn(
      'Check the binary path in the configuration page or ' +
        `visit ${vampirLink} for instructions.`
    );
  }
}

export function checkVampirBinary(): boolean {
  const vampirExec = config.getVampirExec();
  logger.debug(vampirExec, 'config.getVampirExec()');
  try {
    const ls = spawnSync(vampirExec, ['--version']);
    if (ls.status !== 0) {
      logger.debug('VampIR is not installed.', 'checkVampirBinary');
      return false;
    }
    return true;
  } catch (e) {
    logger.debug('VampIR is not installed.', 'checkVampirBinary');
    return false;
  }
}
