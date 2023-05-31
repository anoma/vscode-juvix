/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { logger } from './utils/debug';

export function activate(_context: vscode.ExtensionContext) {
  const config = new JuvixConfig();

  vscode.languages.registerDocumentFormattingEditProvider('Juvix', {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      const filePath = document.uri.fsPath;
      const formatterCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        '--stdin',
        'dev',
        'scope',
        filePath,
        '--with-comments',
      ].join(' ');

      logger.trace(`Formatting ${filePath}\n${formatterCall}`, 'formatter.ts');

      const { spawnSync } = require('child_process');
      const ls = spawnSync(formatterCall, {
        shell: true,
        input: document.getText(),
        encoding: 'utf8',
      });

      if (ls.status == 0) {
        const stdout = ls.stdout;
        return [vscode.TextEdit.replace(range, stdout)];
      } else {
        const errMsg: string = ls.stderr.toString();
        logger.error('formatter provider error' + errMsg, 'formatter.ts');
        throw new Error(errMsg);
      }
    },
  });

  // JuvixGeb

  vscode.languages.registerDocumentFormattingEditProvider('JuvixGeb', {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      const filePath = document.uri.fsPath;
      logger.trace(`Formatting ${filePath}`, 'formatter.ts');
      const formatterCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        '--stdin',
        'dev',
        'geb',
        'read',
        filePath,
      ].join(' ');

      logger.appendLine(formatterCall);

      const { spawnSync } = require('child_process');
      const ls = spawnSync(formatterCall, {
        shell: true,
        input: document.getText(),
        encoding: 'utf8',
      });

      logger.appendLine(ls.stdout);

      if (ls.status == 0) {
        const stdout = ls.stdout;
        return [vscode.TextEdit.replace(range, stdout)];
      } else {
        const errMsg: string = ls.stderr.toString();
        throw new Error(errMsg);
      }
    },
  });
}
