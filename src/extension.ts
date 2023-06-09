/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import * as check from './check';
import * as codelens from './codelens';
import * as goToDefinition from './definitions';
import * as dev from './dev';
import * as formatter from './formatter';
import * as syntaxHighlighter from './highlighting';
import * as hoverInfo from './hover';
import * as inputMethod from './input';
import * as judoc from './judoc';
import * as repl from './repl';
import * as statusBar from './statusbar';
import * as tasks from './tasks';
import * as vampir from './vampir/tasks';
import * as installer from './installer';
import { checkForUpgrade, checkJuvixBinary, juvixIsNotInstalled } from './juvixVersion';
import { logger } from './utils/debug'
import { config } from './config';

export async function activate(context: vscode.ExtensionContext) {
  logger.debug("Activating Juvix Mode");
  logger.debug("Initial config: " + config.getJuvixExec());
  installer.activate(context);

  let version = checkJuvixBinary();
  vscode.commands.executeCommand('setContext', "juvix-mode:ready", false);

  if (!version) {
    logger.debug("Juvix binary not found, installing...");
    juvixIsNotInstalled().then(() => {
      version = checkJuvixBinary();
    });
  }
  if (version !== undefined) {
    logger.debug("Juvix version detected: " + version);
    checkForUpgrade(version);
    statusBar.activate(context, version);

    const modules = [
      codelens,
      syntaxHighlighter,
      goToDefinition,
      hoverInfo,
      tasks,
      inputMethod,
      repl,
      judoc,
      check,
      formatter,
      vampir,
      dev
    ];
    modules.forEach(module => module.activate(context));
    vscode.commands.executeCommand('setContext', "juvix-mode:ready", true);
  }
}
