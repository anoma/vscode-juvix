/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
// import * as path from 'path';
import * as syntax from './highlighting';
import * as tasks from './tasks';
import * as config from './config';

let juvixStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  /* 
   Create and show the status bar item
  */
  juvixStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  context.subscriptions.push(juvixStatusBarItem);
  juvixStatusBarItem.text = 'Checking Juvix config...';
  juvixStatusBarItem.show();

  const config = new JuvixConfig();

  const { spawnSync } = require('child_process');
  const ls = spawnSync(config.juvixBin, ['--version']);
  let execJuvixVersion: string;
  if (ls.status !== 0) {
    vscode.window.showErrorMessage(
      'Juvix binary is not installed. Please check the instructions on https://docs.juvix.org'
    );
    return;
  } else {
    execJuvixVersion = ls.stdout.toString();
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItem.text = '🛠️ ' + juvixBinaryVersion;
  }
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

  /* Task provider and command creation per task.
   */
  const provider = new tasks.JuvixTaskProvider();
  const definedTasks = provider.provideTasks();
  const taskProvider: vscode.Disposable = vscode.tasks.registerTaskProvider(
    tasks.TASK_TYPE,
    provider
  );
  context.subscriptions.push(taskProvider);

  definedTasks
    .then(tasks => {
      for (const task of tasks) {
        const cmdName = 'juvix-mode.' + task.name.replace(' ', '-');
        const cmd = vscode.commands.registerCommand(cmdName, () => {
          vscode.tasks.executeTask(task);
        });

        context.subscriptions.push(cmd);
      }
    })
    .catch(err => {
      vscode.window.showErrorMessage(err);
    });
}
