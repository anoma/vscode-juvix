/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { debugChannel } from './utils/debug';
import { JuvixConfig, TaggedList } from './config';
import * as vscode from 'vscode';
import { observable } from 'mobx';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  debugChannel.info('Enabling dev views');
  context.subscriptions.push(new DevEnv());
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => new DevEnv(doc))
  );
}

class DevEnv {
  readonly config: JuvixConfig;
  private disposables: vscode.Disposable[] = [];
  readonly views: View[] = [];

  @observable
  readonly document: vscode.TextDocument | undefined;

  constructor(doc?: vscode.TextDocument | undefined) {
    this.config = new JuvixConfig();
    this.document = vscode.window.activeTextEditor?.document;
    if (doc) this.document = doc;
    else this.document = vscode.window.activeTextEditor?.document;

    if (this.config.enableDevViews.get()) this.makeViews();

    const closeD = vscode.workspace.onDidCloseTextDocument(doc => {
      this.disposables.push(closeD);
      if (doc === this.document) this.dispose();
    });
    const changeConf = vscode.workspace.onDidChangeConfiguration(e => {
      this.disposables.push(changeConf);
      if (
        e.affectsConfiguration('juvix-mode.devViews') &&
        !this.config.enableDevViews.get()
      ) {
        debugChannel.info('Disposing dev views');
        this.dispose();
      }
    });
    const saveDoc = vscode.workspace.onDidSaveTextDocument(doc => {
      this.disposables.push(saveDoc);
      if (doc === this.document) this.makeViews();
    });
    const changeEditor = vscode.window.onDidChangeActiveTextEditor(e => {
      this.disposables.push(changeEditor);
      if (e && e.document !== this.document) this.dispose();
    });
  }

  makeViews() {
    this.disposeViews();
    if (!this.config.enableDevViews.get() || !this.document) return;
    const views = this.config.devViews.get();
    const txt: string = this.document!.getText();
    const debugStr = '-- DEBUG: ';
    const all = txt.indexOf(debugStr + 'ALL') > -1;
    // FIX: use a regex match to see if the file has a debug flag
    Object.entries(views).forEach(([title, cmd], _) => {
      if (all || txt.indexOf(debugStr + title) > -1)
        this.views.push(new View(title, cmd, this.document!));
    });
  }

  disposeViews() {
    for (const x of this.views) if (x) x.dispose();
  }

  dispose() {
    for (const x of this.disposables) if (x) x.dispose();
    this.disposeViews();
  }
}

class View {
  readonly title: string;
  readonly cmd: string;
  readonly doc: vscode.TextDocument;
  private panel: vscode.Terminal;

  constructor(title: string, cmd: string, document: vscode.TextDocument) {
    this.title = title;
    this.cmd = cmd;
    this.doc = document;
    debugChannel.info(`Creating dev view:` + title);
    debugChannel.info(`> with cmd:` + cmd);
    const opts: vscode.TerminalOptions = {
      name: title,
      cwd: path.dirname(this.doc.fileName),
      isTransient: false,
      shellPath: '/usr/bin/bash',
      location: {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
    };
    this.panel = vscode.window.createTerminal(opts);
    const config = new JuvixConfig();
    const finalCmd = cmd
      .replace('$juvix', config.getJuvixExec())
      .replace('$filename', this.doc.fileName);
    // The replacements here could be done with a
    // mustache template or similar.
    this.panel.sendText(finalCmd);
  }

  dispose() {
    this.panel.dispose();
  }
}
