/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile, runShellCommand } from './utils/base';
import { logger } from './utils/debug';
import {setJuvixCommandStatusBarItem, inProgressJuvixCommandStatusBar, showExecResultJuvixStatusBar } from './statusbar';

export async function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();

  switch (config.typecheckOn()) {
    case 'change':
      context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
          const doc = e.document;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            vscode.commands.executeCommand(
              'juvix-mode.typecheck-silent',
              doc,
              doc.getText(),
            )
        }),
      );
      break;
    case 'save':
      context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            vscode.commands.executeCommand(
              'juvix-mode.typecheck-silent',
              doc,
              doc.getText(),
            )
        }),
      );
      break;
    default:
      return;
  }
}
