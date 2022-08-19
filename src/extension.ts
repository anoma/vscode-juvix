/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
// import * as path from 'path';
import * as syntax from './highlighting';
import * as tasks from './tasks';
import * as user from './config';

let juvixStatusBarItemVersion: vscode.StatusBarItem;
let juvixStatusBarItemDoctor: vscode.StatusBarItem;
let juvixStatusBarItemTypecheck: vscode.StatusBarItem;
let juvixStatusBarItemCompile: vscode.StatusBarItem;
let juvixStatusBarItemRun: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();
  const binaryName = config.getBinaryName();

  /* 
   Create and show the status bar item
  */

  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  context.subscriptions.push(juvixStatusBarItemVersion);

  juvixStatusBarItemVersion.text = 'Checking Juvix config...';
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';
  juvixStatusBarItemVersion.show();
  context.subscriptions.push(juvixStatusBarItemDoctor);

  if (config.statusBarIcons) {
    juvixStatusBarItemDoctor = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    juvixStatusBarItemDoctor.text = '🛠️';
    juvixStatusBarItemDoctor.tooltip = 'Run Juvix doctor';
    juvixStatusBarItemDoctor.command = 'juvix-mode.doctor';
    juvixStatusBarItemDoctor.show();

    juvixStatusBarItemTypecheck = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    juvixStatusBarItemTypecheck.text = '🔍';
    juvixStatusBarItemTypecheck.tooltip = 'Typecheck Juvix program';
    juvixStatusBarItemTypecheck.command = 'juvix-mode.typecheck';
    juvixStatusBarItemTypecheck.show();
    context.subscriptions.push(juvixStatusBarItemTypecheck);

    juvixStatusBarItemCompile = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    juvixStatusBarItemCompile.text = '🔨';
    juvixStatusBarItemCompile.tooltip = 'Compile Juvix program';
    juvixStatusBarItemCompile.command = 'juvix-mode.compile';
    juvixStatusBarItemCompile.show();
    context.subscriptions.push(juvixStatusBarItemCompile);

    juvixStatusBarItemRun = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    juvixStatusBarItemRun.text = '▶️';
    juvixStatusBarItemRun.tooltip = 'Run Juvix program';
    juvixStatusBarItemRun.command = 'juvix-mode.run';
    juvixStatusBarItemRun.show();
    context.subscriptions.push(juvixStatusBarItemRun);
  }

  const { spawnSync } = require('child_process');
  const ls = spawnSync(binaryName, ['--version']);
  let execJuvixVersion: string;
  if (ls.status !== 0) {
    vscode.window.showErrorMessage(
      'Juvix binary is not installed. Please check the instructions on https://docs.juvix.org'
    );
    return;
  } else {
    execJuvixVersion = ls.stdout.toString().replace('version ', 'v');
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItemVersion.text = juvixBinaryVersion;
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

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeConfiguration(() => {
  //     vscode.window.showInformationMessage('Updating Juvix configuration ...');
  //     vscode.commands.executeCommand('workbench.action.reloadWindow');
  //   })
  // );
}
