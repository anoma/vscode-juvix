/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import * as utils from './utils/base';

export let juvixStatusBarItemVersion: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext, version: string) {
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(version, {
        modal: true,
      });
    })
  );

  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  juvixStatusBarItemVersion.text = version;
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';
  juvixStatusBarItemVersion.hide();
  context.subscriptions.push(juvixStatusBarItemVersion);

  if (vscode.window.activeTextEditor) {
    if (utils.needsJuvix(vscode.window.activeTextEditor.document)) {
      juvixStatusBarItemVersion.show();
    }
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && utils.needsJuvix(editor.document)) {
        juvixStatusBarItemVersion.show();
      } else {
        juvixStatusBarItemVersion.hide();
      }
    })
  );
}
