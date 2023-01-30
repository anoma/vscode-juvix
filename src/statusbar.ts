/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import * as user from './config';
import * as utils from './utils/base';


export let juvixStatusBarItemVersion: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();
  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  context.subscriptions.push(juvixStatusBarItemVersion);

  juvixStatusBarItemVersion.text = 'Checking Juvix config...';
  juvixStatusBarItemVersion.show();

  const { spawnSync } = require('child_process');
  const ls = spawnSync(config.getJuvixExec(), ['--version']);

  let execJuvixVersion: string;
  if (ls.status !== 0) {
    debugChannel.error(
      'Juvix binary is not installed. Please check the binary path in the configuration page or the instructions on https://docs.juvix.or to install it.'
    );
    juvixStatusBarItemVersion.hide();
    // debug.log('info', 'Juvix exec: ' + config.getJuvixExec());
    return;
  } else {
    execJuvixVersion = ls.stdout.toString().replace('version ', 'v');
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItemVersion.text = juvixBinaryVersion;
    // debug.log('info', 'Juvix binary version: ' + juvixBinaryVersion);
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(execJuvixVersion, { modal: true });
    })
  );
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && utils.needsJuvix(editor.document)) {
        juvixStatusBarItemVersion.show();
      } else {
        juvixStatusBarItemVersion.hide();
      }

    })
  );
}
