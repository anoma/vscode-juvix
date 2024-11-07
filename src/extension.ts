/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import * as check from './check';
import * as codelens from './codelens';
import * as goToDefinition from './definitions';
import * as formatter from './formatter';
import * as syntaxHighlighter from './highlighting';
import * as hoverInfo from './hover';
import * as judoc from './judoc';
import * as repl from './repl';
import * as statusBar from './statusbar';
import * as tasks from './tasks'; // This one contains the typecheck and compile tasks
import * as installer from './installer';
import {
  checkForUpgrade,
  checkJuvixBinary,
  juvixIsNotInstalled,
} from './juvixVersion';
import { logger } from './utils/debug';
import { config } from './config';

export async function activate(context: vscode.ExtensionContext) {
  logger.debug('Activating Juvix Mode');
  logger.debug('Initial config: ' + config.getJuvixExec());
  installer.activate(context);

  let juvixVersion = await checkJuvixBinary();
  vscode.commands.executeCommand('setContext', 'juvix-mode:ready', false);

  if (!juvixVersion) {
    logger.debug('Juvix binary not found, installing...');
    juvixIsNotInstalled().then(async () => {
      juvixVersion = await checkJuvixBinary();
    });
  }
  if (juvixVersion !== undefined) {
    logger.debug('Juvix version detected: ' + juvixVersion);
    checkForUpgrade(juvixVersion);
    statusBar.activate(context, juvixVersion);

    const modules = [
      codelens,
      syntaxHighlighter,
      goToDefinition,
      hoverInfo,
      tasks,
      repl,
      judoc,
      formatter,
    ];
    modules.forEach(module => module.activate(context));

    vscode.commands.executeCommand('setContext', 'juvix-mode:ready', true);
  }
}
