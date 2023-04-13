/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { debugChannel } from './utils/debug';

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
        'format',
        filePath,
      ].join(' ');

      debugChannel.info(`Formatting ${filePath}`);
      debugChannel.appendLine(formatterCall);

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
        throw new Error(errMsg);
      }
    },
  });

  // JuvixCore

  // FIXME: one anoma/juvix/issue/#1841 is fixed.
  // vscode.languages.registerDocumentFormattingEditProvider('JuvixCore', {
  //   provideDocumentFormattingEdits(
  //     document: vscode.TextDocument
  //   ): vscode.TextEdit[] {
  //     const range = new vscode.Range(
  //       document.positionAt(0),
  //       document.positionAt(document.getText().length)
  //     );

  //     const filePath = document.uri.fsPath;
  //     debugChannel.appendLine(`Formatting ${filePath}`);
  //     const formatterCall = [
  //       config.getJuvixExec(),
  //       config.getGlobalFlags(),
  //       '--stdin',
  //       'dev',
  //       'core',
  //       'read',
  //       filePath,
  //     ].join(' ');

  //     debugChannel.appendLine(formatterCall);

  //     const { spawnSync } = require('child_process');
  //     const ls = spawnSync(formatterCall, {
  //       shell: true,
  //       input: document.getText(),
  //       encoding: 'utf8',
  //     });

  //     debugChannel.appendLine(ls.stdout);

  //     if (ls.status == 0) {
  //       const stdout = ls.stdout;
  //       return [vscode.TextEdit.replace(range, stdout)];
  //     } else {
  //       const errMsg: string = ls.stderr.toString();
  //       throw new Error(errMsg);
  //     }
  //   },
  // });

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
      debugChannel.appendLine(`Formatting ${filePath}`);
      const formatterCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        '--stdin',
        'dev',
        'geb',
        'read',
        filePath,
      ].join(' ');

      debugChannel.appendLine(formatterCall);

      const { spawnSync } = require('child_process');
      const ls = spawnSync(formatterCall, {
        shell: true,
        input: document.getText(),
        encoding: 'utf8',
      });

      debugChannel.appendLine(ls.stdout);

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
