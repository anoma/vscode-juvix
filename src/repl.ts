/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { debugChannel } from './utils/debug';
import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { debug } from 'console';
import { observable } from 'mobx';
import { REPLServer } from 'repl';

export const terminalName = 'Juvix REPL';

export class JuvixRepl {
  private _terminal: vscode.Terminal;
  public name = terminalName;

  @observable
  public activeDocument: vscode.TextDocument | undefined;

  constructor(fresh = true, name: string = terminalName) {
    const oldTerminal = vscode.window.terminals.find(
      terminal => terminal.name === this.name
    );
    if (fresh) {
      oldTerminal?.dispose();
    }
    if (!fresh && oldTerminal) this._terminal = oldTerminal;
    else {
      this._terminal = vscode.window.createTerminal(this.name);
      this.clear();
    }
    if (name) this.name = name;
  }

  public sendText(msg: string) {
    debugChannel.info('Sending text to REPL: ' + msg);
    this._terminal.sendText(msg);
  }

  public dispose() {
    debugChannel.info('Disposing Juvix REPL');
    this._terminal.dispose();
  }
  public clear() {
    this._terminal.sendText('\x0C');
    // this._terminal.sendText('\x0C');
  }
  public show() {
    this._terminal.show(false);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  vscode.window.terminals
    .find(terminal => terminal.name === terminalName)
    ?.dispose();
  /* Create a new terminal and send the command to load the current file */
  const cmdVscode = vscode.commands.registerCommand('juvix-mode.repl', () => {
    const repl = new JuvixRepl(true);
    const config = new JuvixConfig();
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    repl.activeDocument = activeEditor.document;
    const filename = repl.activeDocument.fileName;
    let shellCmd = config.getJuvixExec();
    if (repl.activeDocument.languageId == 'Juvix') {
      shellCmd += ' ' + 'repl';
      repl.sendText(shellCmd);
      repl.show();
      repl.sendText(`:load ${filename}`);
    } else if (repl.activeDocument.languageId == 'JuvixCore') {
      shellCmd += ' ' + 'dev core eval' + ' ' + filename;
      repl.sendText(shellCmd);
      repl.show();
    } else {
      debugChannel.error('Unknown language');
      return;
    }
  });
  context.subscriptions.push(cmdVscode);

  /* Send selections to the active Juvix REPL */
  // const sendSelection = vscode.commands.registerCommand(
  //   'juvix-mode.selection',
  //   () => {
  //     const repl = new JuvixRepl();
  //     const activeEditor = vscode.window.activeTextEditor;
  //     if (!activeEditor) {
  //       return;
  //     }
  //     // const selection =
  //     //   ':{\n' +
  //     //   activeEditor.document.getText(activeEditor.selection) +
  //     //   '\n:}\n';
  //     const selection =
  //     ':multiline\n' + activeEditor.document.getText(activeEditor.selection);
  //     repl.sendText(selection);
  //     repl.sendText('^D');
  //     repl.show();
  //   }
  // );
  // context.subscriptions.push(sendSelection);

  /* Reload the current file in the active Juvix REPL */
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async document => {
      const juvixTerminal = vscode.window.terminals.find(
        terminal => terminal.name === terminalName
      );
      if (!juvixTerminal) return;
      const activeTerminal = vscode.window.activeTerminal;
      if (activeTerminal?.name === terminalName) {
        const repl = new JuvixRepl(false);
        const filename = document.fileName;
        if (
          document.languageId == 'Juvix' ||
          document.languageId == 'JuvixCore'
        )
          repl.sendText(`:reload ${filename}`);
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(async document => {
      if (
        !(document.languageId == 'Juvix' || document.languageId == 'JuvixCore')
      )
        return;

      const activeTerminal = vscode.window.activeTerminal;
      if (activeTerminal?.name === terminalName) {
        const repl = new JuvixRepl(false);
        repl.sendText(`:quit`);
        repl.dispose();
      }
    })
  );
}
