/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
// import * as path from 'path';
import * as syntax from './highlighting';
import * as tasks from './tasks';

let juvixStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  /* 
   Create and show the status bar item
  */
  juvixStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  context.subscriptions.push(juvixStatusBarItem);

  const { spawnSync } = require('child_process');
  const ls = spawnSync('juvix', ['--version']);
  let execJuvixVersion: string;
  if (ls.status !== 0) {
    vscode.window.showErrorMessage('Juvix binary not found');
    execJuvixVersion = ls.stderr.toString();
    juvixStatusBarItem.text = 'Juvix not found';
  } else {
    execJuvixVersion = ls.stdout.toString();
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItem.text = '🛠️ ' + juvixBinaryVersion;
  }
  juvixStatusBarItem.show();
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(execJuvixVersion, { modal: true });
    })
  );

  /* 
    Semantic syntax highlight 
  */
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'Juvix', scheme: 'file' },
      new syntax.Highlighter(),
      syntax.legend
    )
  );

  /*
    Go to definition
      */
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: 'Juvix', scheme: 'file' },
      new syntax.JuvixDefinitionProvider()
    )
  );

  /* Task provider */
  context.subscriptions.push(tasks.activateTaskProvider());
}
