/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as proc from 'child_process';
import { JuvixConfig } from './config';
import { debugChannel } from './utils/debug';

export function activate(_context: vscode.ExtensionContext) {
  const config = new JuvixConfig();

  vscode.languages.registerDocumentFormattingEditProvider('Juvix', {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      const showErrorMessage = (friendlyText: string, error: any) => {
        vscode.window.showErrorMessage(
          `${friendlyText}\n${error.stderr.toString()}`
        );
        return [];
      };

      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      const filePath = document.uri.fsPath;
      debugChannel.appendLine(`Formatting ${filePath}`);
      const formatterCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        'dev',
        'scope',
        filePath,
        '--with-comments',
      ].join(' ');
      try {
        document.save();
        debugChannel.appendLine('Saved file before formatting');
        const styledText = proc.execSync(formatterCall).toString();
        return [vscode.TextEdit.replace(range, styledText)];
      } catch (error) {
        debugChannel.info('Error formatting file', error);
      }
      return [];
    },
  });
}
