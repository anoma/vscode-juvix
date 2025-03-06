'use strict';
import * as vscode from 'vscode';
import * as user from './config';
import * as utils from './utils/base';

export let juvixStatusBarItemVersion: vscode.StatusBarItem;
export let JuvixCommandStatusItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext, version: string) {
  const config = new user.JuvixConfig();
  activateStatusBarCommandItem(context, config);

  activateStatusBarJuvixVersionItem(context, version);

  for (const item of [juvixStatusBarItemVersion, JuvixCommandStatusItem]) {

    if (vscode.window.activeTextEditor) {
      if (utils.needsJuvix(vscode.window.activeTextEditor.document)) {
        item.show();
      }
    }

    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && utils.needsJuvix(editor.document)) {
          item.show();
        } else {
          item.hide();
        }
      }),
    );
  }

}

export function activateStatusBarJuvixVersionItem(context: vscode.ExtensionContext, version: string) {
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.getBinaryVersion', () => {
      vscode.window.showInformationMessage(version, {
        modal: true,
      });
    }),
  );
  juvixStatusBarItemVersion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  juvixStatusBarItemVersion.text = version;
  juvixStatusBarItemVersion.command = 'juvix-mode.getBinaryVersion';
  juvixStatusBarItemVersion.hide();

  context.subscriptions.push(juvixStatusBarItemVersion);

}

export function activateStatusBarCommandItem(context: vscode.ExtensionContext, _config: user.JuvixConfig) {
  /* The itemPriority number is used to arrange items in the status bar, specifically on the left.
     The higher the position to the left, and with many extensions, the order becomes unpredictable
     and it can get mixed up. The number 999 appears to be high enough to make it visible most of
     the time. */
  const itemPriority = 999;
  JuvixCommandStatusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    itemPriority
  );
  JuvixCommandStatusItem.hide();
  context.subscriptions.push(JuvixCommandStatusItem);
}


function updateJuvixStatusBar(icon: string = '', text: string, tooltip: string, color: string = '', backgroundColor: vscode.ThemeColor) {
  JuvixCommandStatusItem.text = `$(${icon}) Juvix: ${text}`;
  JuvixCommandStatusItem.tooltip = tooltip;
  JuvixCommandStatusItem.color = color;
  JuvixCommandStatusItem.backgroundColor = backgroundColor;
  JuvixCommandStatusItem.show();
}

export function setJuvixCommandStatusBarItem() {
  JuvixCommandStatusItem.hide();
  JuvixCommandStatusItem.text = '';
  JuvixCommandStatusItem.tooltip = '';
  JuvixCommandStatusItem.color = '';
  JuvixCommandStatusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.progressBackground');
}

export function inProgressJuvixCommandStatusBar(cmd: string) {
  updateJuvixStatusBar('sync~spin', `${cmd} in progress`, '', 'white', new vscode.ThemeColor('statusBarItem.progressBackground'));
}

export function showExecResultJuvixStatusBar(success: boolean, cmd: string, tooltip?: string) {
  if (success) {
    updateJuvixStatusBar(
      'check',
      `${cmd} succeeded`,
      tooltip || `${cmd} succeeded`,
      'white',
      new vscode.ThemeColor('statusBarItem.successBackground')

    );
  } else {
    updateJuvixStatusBar(
      'error',
      `${cmd} failed`,
      tooltip || `${cmd} failed`,
      'white',
      new vscode.ThemeColor('statusBarItem.errorBackground')

    );
  }
}
