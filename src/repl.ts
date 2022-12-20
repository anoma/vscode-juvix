/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { debugChannel } from './utils/debug';
import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { observable } from 'mobx';
import * as path from 'path';
import { debug } from 'console';

export const terminalName = 'Juvix REPL';

export const juvixTerminals = new Map<string, JuvixRepl>();

class TermLocationOpts implements vscode.TerminalEditorLocationOptions {
  terminalLocation: vscode.TerminalLocation = vscode.TerminalLocation.Editor;
  viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside;
  preserveFocus = true;
}

export class JuvixRepl {
  private terminal: vscode.Terminal;
  private terminalOptions: vscode.TerminalOptions = {
    name: terminalName,
    hideFromUser: true,
    env: process.env,
    isTransient: false, // terminal persistence on restart and reload
    location: new TermLocationOpts(),
  };

  readonly config: JuvixConfig = new JuvixConfig();
  private reloadNextTime = false;

  @observable
  public document: vscode.TextDocument;

  constructor(document: vscode.TextDocument) {
    debugChannel.info('Creating Juvix REPL');
    this.document = document;
    debugChannel.info('document: ' + document.fileName);
    const folder = path.dirname(document.fileName);
    debugChannel.info('folder: ' + folder);
    if (folder) this.terminalOptions.cwd = folder;
    this.terminal = vscode.window.createTerminal(this.terminalOptions);
    juvixTerminals.set(document.fileName, this);
    this.execRepl();
    this.sendText(':h');
  }

  public sendText(msg: string) {
    debugChannel.info('Sending text to REPL: ' + msg);
    this.terminal.sendText(msg);
  }

  public dispose() {
    debugChannel.info('Disposing Juvix REPL');
    this.terminal.dispose();
  }
  public clear() {
    vscode.commands.executeCommand('workbench.action.terminal.clear');
  }
  public show() {
    this.terminal.show(true);
  }
  public exitStatus() {
    this.terminal.exitStatus;
  }

  public notAvailable() {
    return this.terminal.exitStatus && this.terminal.exitStatus.code != 0;
  }

  /* Open the REPL for the current file */
  public execRepl() {
    if (this.notAvailable()) {
      juvixTerminals.delete(this.document.fileName);
      return;
    }
    debugChannel.info('Exec juvix repl');
    let shellCmd = this.config.getJuvixExec();
    if (this.document.languageId == 'Juvix') {
      shellCmd += ' ' + 'repl';
      this.terminal.sendText(shellCmd);
    } else if (this.document.languageId == 'JuvixCore') {
      shellCmd += ' ' + 'dev core repl';
      this.terminal.sendText(shellCmd);
    } else {
      debugChannel.error('Unknown language');
      return;
    }
    this.terminal.show();
  }

  /* Load the current file in the REPL */
  public loadFileRepl() {
    if (this.notAvailable()) {
      juvixTerminals.delete(this.document.fileName);
      return;
    }
    const filename = this.document.fileName;
    debugChannel.info('Loading file in REPL: ' + filename);
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
}

export async function activate(context: vscode.ExtensionContext) {
  /* Create a new terminal and send the command to load the current file */
  const cmdVscode = vscode.commands.registerCommand('juvix-mode.repl', () => {
    const document = vscode.window.activeTextEditor?.document;
    if (document) {
      let repl = juvixTerminals.get(document.fileName);
      debugChannel.info('repl: ' + repl?.document.fileName);
      if (!repl || repl.notAvailable()) repl = new JuvixRepl(document);
      repl.loadFileRepl();
    }
  });
  context.subscriptions.push(cmdVscode);

  const juvixREPL = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  juvixREPL.command = 'juvix-mode.repl';
  juvixREPL.text = 'Open Juvix REPL';
  juvixREPL.show();

  context.subscriptions.push(juvixREPL);

  /* Reload the current file in the active Juvix REPL */
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async document => {
      const config = new JuvixConfig();
      if (!config.reloadReplOnSave.get()) return;
      const repl = juvixTerminals.get(document.fileName);
      if (repl) repl.loadFileRepl();
    })
  );
}
