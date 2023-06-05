/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import * as version from './juvixVersion';
import * as utils from './utils/base';

export let juvixStatusBarItemVersion: vscode.StatusBarItem;

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  context.subscriptions.push(juvixStatusBarItemVersion);
  juvixStatusBarItemVersion.hide();

  const fv = await version.getInstalledFullVersion();
  if (!fv) return;
  juvixStatusBarItemVersion.text = fv;
  juvixStatusBarItemVersion.show();

  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(fv ? fv : 'No Juvix binary found', {
        modal: true,
      });
    })
  );
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';

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
