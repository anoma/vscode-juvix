/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import * as debug from './utils/debug';

export let juvixStatusBarItemVersion: vscode.StatusBarItem;
export let juvixStatusBarItemDoctor: vscode.StatusBarItem;
export let juvixStatusBarItemTypecheck: vscode.StatusBarItem;
export let juvixStatusBarItemCompile: vscode.StatusBarItem;
export let juvixStatusBarItemRun: vscode.StatusBarItem;

export function activate(config: any, context: vscode.ExtensionContext) {
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
    debug.log(
      'info',
      'Juvix binary is not installed. Please check the instructions on https://docs.juvix.org'
    );
    debug.log('info', 'Juvix exec: ' + config.getJuvixExec());
    return;
  } else {
    execJuvixVersion = ls.stdout.toString().replace('version ', 'v');
    const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItemVersion.text = juvixBinaryVersion;
    debug.log('info', 'Juvix binary version: ' + juvixBinaryVersion);
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(execJuvixVersion, { modal: true });
    })
  );
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';
}

// juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
//   vscode.StatusBarAlignment.Left
// );
// context.subscriptions.push(juvixStatusBarItemVersion);

// juvixStatusBarItemVersion.text = 'Checking Juvix config...';
// juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';
// juvixStatusBarItemVersion.show();

// context.subscriptions.push(juvixStatusBarItemDoctor);

// const { spawnSync } = require('child_process');
// const ls = spawnSync(config.getJuvixExec(), ['--version']);
// let execJuvixVersion: string;
// if (ls.status !== 0) {
//   debug.log('info',
//     'Juvix binary is not installed. Please check the instructions on https://docs.juvix.org'
//   );
//   debug.log('info','Juvix exec: ' + config.getJuvixExec());
//   return;
// } else {
//   execJuvixVersion = ls.stdout.toString().replace('version ', 'v');
//   const juvixBinaryVersion: string = execJuvixVersion.split('\n')[0];
//   juvixStatusBarItemVersion.text = juvixBinaryVersion;
// }
// context.subscriptions.push(
//   vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
//     vscode.window.showInformationMessage(execJuvixVersion, { modal: true });
//   })
// );

// /* Task provider and command creation per task.
//  */
// const provider = new tasks.JuvixTaskProvider();
// const definedTasks = provider.provideTasks();
// const taskProvider: vscode.Disposable = vscode.tasks.registerTaskProvider(
//   tasks.TASK_TYPE,
//   provider
// );
// context.subscriptions.push(taskProvider);

// definedTasks
//   .then(tasks => {
//     for (const task of tasks) {
//       const cmdName = 'juvix-mode.' + task.name.replace(' ', '-');
//       const cmd = vscode.commands.registerCommand(cmdName, () => {
//         vscode.tasks.executeTask(task);
//       });
//       context.subscriptions.push(cmd);
//     }
//   })
//   .catch(err => {
//     debug.log('info',err);
//   });

// context.subscriptions.push(
//   vscode.workspace.onDidChangeConfiguration(e => {
//     if (e.affectsConfiguration('[Juvix]')) {
//       // activate(context);
//       vscode.window.showInformationMessage(
//         'Updating Juvix configuration ...'
//       );
//       vscode.commands.executeCommand('workbench.action.reloadWindow');
//     }
//   })
// );

// if (config.statusBarIcons) {
//   juvixStatusBarItemDoctor = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Left
//   );
//   juvixStatusBarItemDoctor.text = '[🛠️ Doctor]';
//   juvixStatusBarItemDoctor.tooltip = 'Run Juvix doctor';
//   juvixStatusBarItemDoctor.command = 'juvix-mode.doctor';
//   juvixStatusBarItemDoctor.show();

//   juvixStatusBarItemTypecheck = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Left
//   );
//   juvixStatusBarItemTypecheck.text = '[🔍 Check]';
//   juvixStatusBarItemTypecheck.tooltip = 'Typecheck Juvix program';
//   juvixStatusBarItemTypecheck.command = 'juvix-mode.typecheck';
//   juvixStatusBarItemTypecheck.show();
//   context.subscriptions.push(juvixStatusBarItemTypecheck);

//   juvixStatusBarItemCompile = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Left
//   );
//   juvixStatusBarItemCompile.text = '[🔨 Compile]';
//   juvixStatusBarItemCompile.tooltip = 'Compile Juvix program';
//   juvixStatusBarItemCompile.command = 'juvix-mode.compile';
//   juvixStatusBarItemCompile.show();
//   context.subscriptions.push(juvixStatusBarItemCompile);

//   juvixStatusBarItemRun = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Left
//   );
//   juvixStatusBarItemRun.text = '[ ▶️ Run]';
//   juvixStatusBarItemRun.tooltip = 'Run Juvix program';
//   juvixStatusBarItemRun.command = 'juvix-mode.run';
//   juvixStatusBarItemRun.show();
//   context.subscriptions.push(juvixStatusBarItemRun);
// }
