/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile, runShellCommand } from './utils/base';
import { logger } from './utils/debug';

export async function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();

  const command = 'juvix-mode.typecheck-silent';

  const commandHandler = async (doc: vscode.TextDocument, content: string) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document == doc) {
      if (doc && isJuvixFile(doc)) {
        const filePath = doc.fileName;
        const typecheckerCall = [
          config.getJuvixExec(),
          config.getGlobalFlags(),
          'typecheck',
          config.getTypeckeckFlags(),
          filePath,
        ].join(' ');

        const res = await runShellCommand(typecheckerCall, content);

        if (res.status !== 0) {
          const errMsg: string = "Juvix Error: " + res.stderr.toString();
          logger.error(errMsg, 'check.ts');
          vscode.window.showErrorMessage(errMsg);
        }
        return res.stdout;
      }
    }
    return '';
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler),
  );

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
            );
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
            );
        }),
      );
      break;
    default:
      return;
  }
}
