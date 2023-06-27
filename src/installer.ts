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

const userHome = env['XDG_BIN_HOME'] || env.HOME || '~';
const INSTALLBIN_PATH = path.join(userHome, '.local', 'bin');

export class Installer {
  readonly name: string;
  private terminal: vscode.Terminal;
  private disposables: vscode.Disposable[] = [];

  readonly shellCmd: string;

  constructor(
    name: string,
    shellCommand: string,
    env: { [key: string]: string }
  ) {
    this.name = name;
    const options: vscode.TerminalOptions = {
      name: `${name} binary installation`,
      isTransient: false,
      hideFromUser: true,
      env: env,
    };
    this.terminal = vscode.window.createTerminal(options);
    this.shellCmd = shellCommand;
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
                  `${this.name} binary installation complete.`,
                  'Reload window'
                )
                .then(selection => {
                  if (selection === 'Reload window') {
                    vscode.window.terminals.forEach(t => t.dispose());
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
    const name = this.name;
    if (process.platform === 'win32') {
      vscode.window.showInformationMessage(
        `${name} is not supported on Windows yet.`
      );
      return;
    }

    vscode.window
      .withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing ${name}`,
          cancellable: true,
        },
        async (_progress, token) => {
          token.onCancellationRequested(() => {
            logger.trace(`User canceled the ${name} binary installation`);
            this.terminal.dispose();
            return exit(1);
          });
          return await this.promiseCall(this.shellCmd);
        }
      )
      .then(exitStatus => {
        logger.trace(`${name} exit status: ${exitStatus.code}`);
        logger.trace(`${name} exit signal: ${exitStatus.reason}`);
        if (exitStatus === undefined) {
          vscode.window.showErrorMessage(`${name} binary installation failed.`);
          this.terminal.show();
        }
      });
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}

export async function installJuvix() {
  const installer = new Installer(
    'Juvix',
    "curl --proto '=https' --tlsv1.2 -sSfL https://get.juvix.org | sh && exit 0",
    {
      JUVIX_INSTALLER_ASSUME_YES: '1',
    }
  );
  installer.run();
  installer.dispose();
}

export async function installVampir() {
  const installer = new Installer(
    'Vamp-IR',
    "curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/anoma/juvix-installer/vamp-ir-installer/vamp-ir-installer.sh | sh && exit 0",
    {
      VAMPIR_INSTALLER_ASSUME_YES: '1',
    }
  );
  installer.run();
  installer.dispose();
}

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.installJuvixBinary', () => {
      installJuvix();
    }),
    vscode.commands.registerCommand('juvix-mode.installVampirBinary', () => {
      installVampir();
    })
  );
}
