/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import { exit } from 'process';
import * as vscode from 'vscode';
import { logger } from './utils/debug';
import { config } from './config';
import { env } from 'process';
import * as path from 'path';

const INSTALLBIN_PATH = path.join(env.HOME || '~', '.local', 'bin');

export class Installer {
  private terminal: vscode.Terminal;
  private disposables: vscode.Disposable[] = [];

  readonly shellCmd =
    "curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/anoma/juvix-installer/main/juvix-installer.sh | sh && exit 0";

  constructor() {
    const options: vscode.TerminalOptions = {
      name: 'Juvix binary installation',
      isTransient: false,
      hideFromUser: true,
      env: {
        JUVIX_INSTALLER_ASSUME_YES: '1',
      },
    };
    this.terminal = vscode.window.createTerminal(options);
  }

  public promiseCall(command: string): Promise<vscode.TerminalExitStatus> {
    this.terminal.sendText(command);
    return new Promise((resolve, reject) => {
      const disposeToken = vscode.window.onDidCloseTerminal(
        async closedTerminal => {
          if (closedTerminal === this.terminal) {
            disposeToken.dispose();
            if (this.terminal.exitStatus !== undefined) {
              resolve(this.terminal.exitStatus);
              config.binaryPath.set(INSTALLBIN_PATH);
              vscode.window
                .showInformationMessage(
                  'Juvix binary installation complete.',
                  'Reload window'
                )
                .then(selection => {
                  if (selection === 'Reload window') {
                    vscode.commands.executeCommand(
                      'workbench.action.reloadWindow'
                    );
                  }
                });
            } else reject('Terminal exited with undefined status');
          }
        }
      );
    });
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
          title: 'Installing Juvix',
          cancellable: true,
        },
        async (_progress, token) => {
          token.onCancellationRequested(() => {
            logger.trace('User canceled the Juvix binary installation');
            this.terminal.dispose();
            return exit(1);
          });
          return await this.promiseCall(this.shellCmd);
        }
      )
      .then(exitStatus => {
        logger.trace('Juvix exit status: ' + exitStatus.code);
        logger.trace('Juvix exit signal: ' + exitStatus.reason);
        if (exitStatus === undefined) {
          vscode.window.showErrorMessage('Juvix binary installation failed.');
          this.terminal.show();
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
