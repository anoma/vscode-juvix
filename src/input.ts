/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/*
 * Adapted from vscode-lean sources.
 * See https://github.com/leanprover/vscode-lean
 */

import * as vscode from 'vscode';

import { AbbreviationConfig } from './abbreviation/config';
import { AbbreviationHoverProvider } from './abbreviation/AbbreviationHoverProvider';
import { AbbreviationProvider } from './abbreviation/AbbreviationProvider';
import { AbbreviationRewriter } from './abbreviation/rewriter/AbbreviationRewriter';
import { autorunDisposable } from './utils/autorunDisposable';
import { Disposable, languages, TextEditor, window } from 'vscode';
import { observable } from 'mobx';
import { debugChannel } from './utils/debug';
import { debug } from 'console';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new Abbr());
  debugChannel.info('Abbreviation rewriter registered');
}

class Abbr {
  private readonly disposables = new Array<Disposable>();
  private readonly config: AbbreviationConfig; // TODO: unify with JuvixConfig
  private readonly table: AbbreviationProvider;

  constructor() {
    this.config = new AbbreviationConfig();
    this.table = new AbbreviationProvider(this.config);
    const autorun = autorunDisposable(disposables => {
      disposables.push(
        vscode.languages.registerHoverProvider(
          this.config.languages.get(),
          new AbbreviationHoverProvider(this.config, this.table)
        )
      );
    });
    this.disposables.push(autorun);

    const currentEditor = window.activeTextEditor;
    let rewriter: AbbreviationRewriter | undefined = undefined;
    if (currentEditor && this.shouldEnableRewriterForEditor(currentEditor)) {
      rewriter = new AbbreviationRewriter(
        this.config,
        this.table,
        currentEditor,
        debugChannel
      );
      this.disposables.push(rewriter);
    }
    const changeEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && this.shouldEnableRewriterForEditor(editor)) {
        rewriter?.dispose();
        rewriter = new AbbreviationRewriter(
          this.config,
          this.table,
          editor,
          debugChannel
        );
        this.disposables.push(rewriter);
      }
    });
    this.disposables.push(changeEditor);
  }

  shouldEnableRewriterForEditor(editor: TextEditor): boolean {
    if (!this.config.inputModeEnabled) {
      return false;
    }
    if (!languages.match(this.config.languages.get(), editor.document)) {
      return false;
    }
    return true;
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
