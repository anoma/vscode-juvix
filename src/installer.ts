/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

export class Installer {
  private terminal: vscode.Terminal;
  readonly shellCmd =
    "curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/anoma/juvix-installer/main/juvix-installer.sh | sh"
    + '&& echo && read -n 1 -s -r -p "Press any key to continue" && exit\n';

  constructor() {
    const options: vscode.TerminalOptions = {
      name: 'Juvix binary installation',
      isTransient: false,
      // hideFromUser: true,
      // shellPath: '/usr/bin/fish',
      env: {
        "JUVIX_INSTALLER_ASSUME_YES" : "1"
      }
    };
    this.terminal = vscode.window.createTerminal(options);
  }

  public promiseCall(command: string): Promise<vscode.TerminalExitStatus> {
    this.terminal.show();
    this.terminal.sendText(command);
    return new Promise((resolve, reject) => {
      const disposeToken = vscode.window.onDidCloseTerminal(
        async closedTerminal => {
          if (closedTerminal === this.terminal) {
            disposeToken.dispose();
            if (this.terminal.exitStatus !== undefined)
              resolve(this.terminal.exitStatus);
            else reject('Terminal exited with undefined status');
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
    vscode.window.onDidCloseTerminal(t => {
      if (t.name === this.terminal.name) {
        // restart the extension
        vscode.commands.executeCommand('workbench.action.reloadWindow');
        vscode.window.showInformationMessage(
          'Juvix extension has reloaded your window.'
        );
      }
    });
    const ready: Promise<vscode.TerminalExitStatus> =
      this.promiseCall(this.shellCmd);
    ready.then(status => {
      if (status.code == 0) {
        this.terminal.sendText('exit');
      } else {
        vscode.window.showErrorMessage(
          'Juvix installation failed. Please check the logs.'
        );
      }
    });
  }
}

export async function installJuvix() {
  const installer = new Installer();
  installer.run();
}
