/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { config } from './config';
import { logger } from './utils/debug';
import { runShellCommand } from './utils/base';

export function activate(_context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider('Juvix', {
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
    ): Promise<vscode.TextEdit[]> {
      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length),
      );

      const filePath = document.uri.fsPath;
      const formatterCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        '--stdin',
        'format',
        filePath,
      ].join(' ');

      const res = await runShellCommand(formatterCall, document.getText());

      if (res.status == 0) {
        const stdout = res.stdout;
        // in case of the empty return from the format command, do nothing
        // this is the way to protect from unexpected behaviour of the `format` command
        return stdout !== '' ? [vscode.TextEdit.replace(range, stdout)] : [];
      } else {
        const errMsg: string = res.stderr.toString();
        logger.warn(errMsg);
        return [];
      }
    },
  });
}
