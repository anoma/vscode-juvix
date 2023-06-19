/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { config } from './config';
import { logger } from './utils/debug';

export function activate(_context: vscode.ExtensionContext) {
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
        'format',
        filePath,
      ].join(' ');

      const { spawnSync } = require('child_process');
      const ls = spawnSync(formatterCall, {
        shell: true,
        input: document.getText(),
        encoding: 'utf8',
      });

      if (ls.status == 0) {
        const stdout = ls.stdout;
        // in case of the empty return from the format command, do nothing
        // this is the way to protect from unexpected behaviour of the `format` command
        return stdout !== '' ? [vscode.TextEdit.replace(range, stdout)] : [];
      } else {
        const errMsg: string = ls.stderr.toString();
        logger.warn(errMsg);
        return [];
      }
    },
  });

  vscode.languages.registerDocumentFormattingEditProvider('JuvixGeb', {
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
        'geb',
        'read',
        filePath,
      ].join(' ');

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
        logger.error(errMsg, 'formatter.ts');
      }
      return [];
    },
  });
}
