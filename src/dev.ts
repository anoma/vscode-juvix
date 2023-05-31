/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { logger } from './utils/debug';
import { JuvixConfig } from './config';
import * as vscode from 'vscode';
import { observable } from 'mobx';
import * as path from 'path';

const debugStr = 'DEBUG:';

export function activate(context: vscode.ExtensionContext) {
  logger.trace('Enabling dev tabs');
  const devEnv = new DevEnv();
  context.subscriptions.push(devEnv);

  const config = new JuvixConfig();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('juvix-mode.enableDevTasks')) {
        if (!config.enableDevTasks.get()) devEnv.dispose();
        else activate(context);
      }
      if (e.affectsConfiguration('juvix-mode.devTasks')) devEnv.makeViews();
    })
  );
}

class DevEnv {
  private disposables: vscode.Disposable[] = [];
  readonly views: View[] = [];

  @observable
  private document: vscode.TextDocument | undefined;

  constructor() {
    const config = new JuvixConfig();
    if (!config.enableDevTasks.get()) return;

    this.document = vscode.window.activeTextEditor?.document;
    if (this.document) this.makeViews();

    const changeEditor = vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document) {
        if (e.document !== this.document) {
          this.disposeViews();
          this.document = e.document;
          this.makeViews();
        }
      }
      this.disposables.push(changeEditor);
    });

    const closeD = vscode.workspace.onDidCloseTextDocument(doc => {
      if (doc === this.document) this.disposeViews();
      this.disposables.push(closeD);
    });

    const saveDoc = vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc === this.document) this.makeViews();
      this.disposables.push(saveDoc);
    });
  }

  makeViews() {
    this.disposeViews();
    const config = new JuvixConfig();
    if (!config.enableDevTasks.get() || !this.document) return;
    const txt: string = this.document!.getText();
    const debug = txt.indexOf(debugStr) > -1;
    if (!debug || txt.indexOf('NO-DEBUG!') > -1) return;
    const all = txt.indexOf(debugStr + ' All') > -1;
    const views = config.devTasks.get();
    Object.entries(views).forEach(([title, cmd], _) => {
      if (all || txt.indexOf(debugStr + ' ' + title) > -1)
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

    const opts: vscode.TerminalOptions = {
      name: title,
      cwd: path.dirname(this.doc.fileName),
      isTransient: false,
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
    this.panel.sendText(finalCmd);
  }

  dispose() {
    this.panel.dispose();
  }
}
