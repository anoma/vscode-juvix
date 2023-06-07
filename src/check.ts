/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile } from './utils/base';
import { logger } from './utils/debug';
import { spawnSync } from 'child_process';

export async function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();

  // case 'typecheck-silent':
  //   exec = new vscode.ShellExecution(JuvixExec + ` --only-errors typecheck  ${fl}`);
  //   break;

  const command = 'juvix-mode.typecheck-silent';

  const commandHandler = (doc: vscode.TextDocument, content: string) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document == doc) {
      if (doc && isJuvixFile(doc)) {
        const filePath = doc.fileName;
        const typecheckerCall = [
          config.getJuvixExec(),
          config.getGlobalFlags(),
          '--only-errors',
          'typecheck',
          filePath,
        ].join(' ');

        const ls = spawnSync(typecheckerCall, {
          input: content,
          shell: true,
          encoding: 'utf8',
        });

        if (ls.status !== 0) {
          const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
          logger.error(errMsg, 'check.ts');
        }
        return ls.stdout;
      }
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler)
  );

  switch (config.typecheckOn.get()) {
    case 'change':
      context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
          const doc = e.document;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            vscode.commands.executeCommand(
              'juvix-mode.typecheck-silent',
              doc,
              doc.getText()
            );
        })
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
              doc.getText()
            );
        })
      );
      break;
    default:
      return;
  }
}
