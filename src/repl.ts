/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { debugChannel } from './utils/debug';
import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { observable } from 'mobx';
import * as path from 'path';

export const terminalName = 'Juvix REPL';

export const juvixTerminals = new Map<string, JuvixRepl>();

export class JuvixRepl {
  public terminal: vscode.Terminal;
  public disposables: vscode.Disposable[] = [];
  public config: JuvixConfig;
  private ready = false;
  private reloadNextTime = false;

  @observable
  public document: vscode.TextDocument;

  constructor(document: vscode.TextDocument) {
    debugChannel.info('Creating Juvix REPL');
    this.config = new JuvixConfig();

    this.document = document;
    debugChannel.info('document: ' + document.fileName);

    const options: vscode.TerminalOptions = {
      name: terminalName,
      cwd: path.dirname(document.fileName),
      isTransient: false,
      shellPath: '/usr/bin/bash',
      location: {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
    };
    debugChannel.info('options: ' + JSON.stringify(options));
    this.terminal = vscode.window.createTerminal(options);
    this.openRepl();

    const reloadFile = vscode.workspace.onDidSaveTextDocument(d => {
      if (d === document && this.config.reloadReplOnSave.get()) {
        this.loadFileRepl();
        this.disposables.push(reloadFile);
      }
    });
    this.disposables.push(reloadFile);

    const closeT = vscode.window.onDidCloseTerminal(closedTerminal => {
      if (closedTerminal === this.terminal) {
        juvixTerminals.delete(document.fileName);
        this.dispose();
      }
    });
    this.disposables.push(closeT);

    const openT = vscode.window.onDidOpenTerminal(openedTerminal => {
      if (openedTerminal === this.terminal) {
        juvixTerminals.set(document.fileName, this);
        openT.dispose();
      }
    });
    this.disposables.push(openT);
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

  /* Open the REPL for the current file */
  public openRepl(): void {
    debugChannel.info('Exec juvix repl');
    let shellCmd = this.config.getJuvixExec();
    if (this.document.languageId == 'Juvix') {
      shellCmd += ' ' + 'repl';
    } else if (this.document.languageId == 'JuvixCore') {
      shellCmd += ' ' + 'dev core repl';
    } else {
      debugChannel.error('Unknown language');
      return;
    }
    const ready: Promise<vscode.TerminalExitStatus> =
      this.promiseCall(shellCmd);
    ready.then(status => {
      if (status.code == 0) {
        vscode.window.showInformationMessage('Juvix REPL ready');
        this.terminal.show();
        this.ready = true;
      } else {
        debugChannel.info('Juvix REPL was closed:', status.code);
        this.ready = false;
      }
    });
  }

  /* Load the current file in the REPL */
  public loadFileRepl(): void {
    const filename = this.document.fileName;
    debugChannel.info('Loading file in REPL: ' + filename);
    if (canRunRepl(this.document)) this.document.save();
    if (this.document.languageId == 'Juvix') {
      if (!this.reloadNextTime) this.terminal.sendText(`:load ${filename}`);
      else this.terminal.sendText(`\n:reload ${filename}`);
    } else if (this.document.languageId == 'JuvixCore') {
      debugChannel.info('It is a core file');
      this.terminal.sendText(`:l ${filename}`);
    } else return;
    this.reloadNextTime = true;
    this.show();
  }

  public sendText(msg: string): void {
    debugChannel.info('Sending text to REPL: ' + msg);
    this.terminal.sendText(msg);
  }

  public dispose(): void {
    debugChannel.info('Disposing Juvix REPL');
    this.terminal.dispose();
    for (const disposable of this.disposables) disposable.dispose();
  }
  public clear(): void {
    vscode.commands.executeCommand('workbench.action.terminal.clear');
  }
  public show(): void {
    this.terminal.show(true);
  }
  public exitStatus(): void {
    this.terminal.exitStatus;
  }

  public notAvailable(): boolean {
    if (!this.terminal.exitStatus) return false;
    return this.terminal.exitStatus.code !== 0;
  }
}

export async function activate(context: vscode.ExtensionContext) {
  /* Create a new terminal and send the command to load the current file */
  const loadFile = vscode.commands.registerCommand(
    'juvix-mode.loadFileRepl',
    () => {
      const document = vscode.window.activeTextEditor?.document;
      if (!document || !canRunRepl(document)) return;
      let repl = juvixTerminals.get(document.fileName);
      if (!repl || repl.notAvailable()) {
        repl?.dispose();
        repl = new JuvixRepl(document);
      }
      debugChannel.info('repl: ' + repl.document.fileName);
      repl.loadFileRepl();
    }
  );
  context.subscriptions.push(loadFile);

  // Create a status bar button to open the REPL
  // only visible when a Juvix/JuvixCore file is open

  const buttonREPL = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  buttonREPL.command = 'juvix-mode.loadFileRepl';
  buttonREPL.text = 'Load file in Juvix REPL';
  context.subscriptions.push(buttonREPL);

  const doc = vscode.window.activeTextEditor?.document;
  if (doc && canRunRepl(doc)) buttonREPL.show();

  const watchButton = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      const doc = editor.document;
      if (canRunRepl(doc)) buttonREPL.show();
      else buttonREPL.hide();
    }
  });
  context.subscriptions.push(watchButton);
}

function canRunRepl(document: vscode.TextDocument): boolean {
  return document.languageId == 'Juvix' || document.languageId == 'JuvixCore';
}
