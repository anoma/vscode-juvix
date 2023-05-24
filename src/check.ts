/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile } from './utils/base';
import { debugChannel } from './utils/debug';
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
        debugChannel.info(`Checking... ${filePath}!`);
        const typecheckerCall = [
          config.getJuvixExec(),
          config.getGlobalFlags(),
          '--only-errors',
          'typecheck',
          filePath,
          // '--stdin',
          // content,
        ].join(' ');

        debugChannel.info('Typecheker call: ' + typecheckerCall);

        const ls = spawnSync(typecheckerCall, {
          input: content,
          shell: true,
          encoding: 'utf8',
        });

        if (ls.status !== 0) {
          const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
          debugChannel.error('typechecking-silent provider error', errMsg);
          throw new Error(errMsg);
        }
        const stdout = ls.stdout;
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
