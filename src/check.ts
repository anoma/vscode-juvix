/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile, runShellCommand, getDiagnosticFromError } from './utils/base';
import { logger } from './utils/debug';
import { setJuvixCommandStatusBarItem, inProgressJuvixCommandStatusBar, showExecResultJuvixStatusBar } from './statusbar';

export async function activate(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
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

        inProgressJuvixCommandStatusBar('Typecheck');
        const { stdout, stderr, status } = await runShellCommand(typecheckerCall, content);

        if (status !== 0) {
          showExecResultJuvixStatusBar(false, 'Typecheck', stderr);
          const diag = getDiagnosticFromError(stderr);
          if (diag)
            diagnosticCollection.set(doc.uri, [diag]);
        }
        else {
          showExecResultJuvixStatusBar(true, 'Typecheck', stdout);
          diagnosticCollection.delete(doc.uri);
        }
        return { stdout, stderr, status };
      }
    }
    return undefined;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler),
  );


  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri))
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(_ => {
      setJuvixCommandStatusBarItem();
    }
    ));

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
