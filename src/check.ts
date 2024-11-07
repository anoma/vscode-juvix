/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile } from './utils/base';
import { logger } from './utils/debug';
import { setJuvixCommandStatusBarItem, inProgressJuvixCommandStatusBar, showExecResultJuvixStatusBar } from './statusbar';
import * as highlighting from './highlighting';

export async function activate(context: vscode.ExtensionContext, typecheckTask: vscode.Task) {
  const config = new user.JuvixConfig();

  switch (config.typecheckOn()) {
    case 'change':
      context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
          const doc = e.document;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            vscode.tasks.executeTask(typecheckTask);
        }),
      );
      break;
    case 'save':
      context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            vscode.tasks.executeTask(typecheckTask);
        }),
      );
      break;
    default:
      return;
  }
}
