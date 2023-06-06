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
          location: vscode.ProgressLocation.Window,
          title: 'Installing Juvix',
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            logger.trace('User canceled the Juvix binary installation');
            this.terminal.dispose();
            return exit(1);
          });
          progress.report({ increment: 0 });
          const exitStatus = await this.promiseCall(this.shellCmd);
          progress.report({ increment: 100 });
          return exitStatus;
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


// const ready: Promise<vscode.TerminalExitStatus> =
//   this.promiseCall(this.shellCmd);
// ready.then(status => {
//   if (status.code == 0) {
//     this.terminal.sendText('exit');
//     const whichJuvix = [
//      `which`,
//      `juvix`,
//     ].join(' ');

//     const ls = spawnSync(whichJuvix, {
//       shell: true,
//       encoding: 'utf8',
//     });

//     if (ls.status !== 0) {
//       const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
//       logger.error(errMsg);
//     }
//     const pathToJuvix = ls.stdout;
//     config.setJuvixExec(pathToJuvix);
//   } else {
//     vscode.window.showErrorMessage(
//       'Juvix installation failed. Please check the logs.'
//     );
//   }
// });
// }
