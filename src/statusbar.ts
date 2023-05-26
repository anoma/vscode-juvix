/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import * as user from './config';
import * as version from './juvixVersion';
import * as utils from './utils/base';

export let juvixStatusBarItemVersion: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  context.subscriptions.push(juvixStatusBarItemVersion);
  juvixStatusBarItemVersion.hide();

  const fv = version.getInstalledFullVersion();
  if (fv) {
    juvixStatusBarItemVersion.text = fv;
    juvixStatusBarItemVersion.show();

    if (!version.isJuvixVersionSupported()) {
      const msg = `${fv} is not supported. Please upgrade to the latest version. Visit https://docs.juvix.org/howto/installing.html for instructions.`;
      vscode.window.showErrorMessage(msg, { modal: true });
    }
  }

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
