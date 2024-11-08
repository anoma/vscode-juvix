import * as vscode from 'vscode';
import * as user from './config';
import { isJuvixFile } from './utils/base';
import { logger } from './utils/debug';

export async function activate(context: vscode.ExtensionContext, typecheckTask: vscode.Task) {
  const config = new user.JuvixConfig();

  switch (config.typecheckOn()) {
    case 'change':
      context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(async e => {
          const doc = e.document;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc))
            await vscode.tasks.executeTask(typecheckTask);
        }),
      );
      break;
    case 'save':
      context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async doc => {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document === doc && isJuvixFile(doc)) {
            await vscode.tasks.executeTask(typecheckTask);
          }
        }),
      );
      break;
    default:
      return;
  }
}
