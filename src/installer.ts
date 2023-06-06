/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import { spawnSync } from 'child_process';
import { exit } from 'process';
import * as vscode from 'vscode';
import { config } from './config';
import { logger } from './utils/debug';

export class Installer {
  private terminal: vscode.Terminal;
  private disposables: vscode.Disposable[] = [];

  readonly shellCmd =
    "curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/anoma/juvix-installer/main/juvix-installer.sh | sh";

  constructor() {
    const options: vscode.TerminalOptions = {
      name: 'Juvix binary installation',
      isTransient: false,
      hideFromUser: true,
      // shellPath: '/usr/bin/fish',
      env: {
        JUVIX_INSTALLER_ASSUME_YES: '1',
      },
    };
    this.terminal = vscode.window.createTerminal(options);
  }

  public async run() {
    if (process.platform === 'win32') {
      vscode.window.showInformationMessage(
        'Juvix is not supported on Windows yet.'
      );
      return;
    }

    vscode.window
      .withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Installing Juvix binary',
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            logger.trace('User canceled the Juvix binary installation');
            this.terminal.dispose();
            return exit(1);
          });

          this.terminal.sendText(this.shellCmd);

          for (let i = 0; i < 9; i++) {
            setTimeout(() => {
              progress.report({ increment: i * 10 });
            }, 10000);
          }
          progress.report({ increment: 100 });
          return this.terminal.exitStatus;
        }
      )
      .then(exitStatus => () => {
        if (exitStatus === undefined) {
          vscode.window.showErrorMessage('Juvix binary installation failed.');
          this.terminal.show();
        } else {
          vscode.window
            .showInformationMessage(
              'Juvix binary installation complete. Please reload your window.',
              'Reload'
            )
            .then(selection => {
              if (selection === 'Reload') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
              }
            });
        }
      });
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}

export async function installJuvix() {
  const installer = new Installer();
  installer.run();
  installer.dispose();
}

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.installBinary', () => {
      installJuvix();
    })
  );
}
