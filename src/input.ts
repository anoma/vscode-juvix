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

export function activate(context: vscode.ExtensionContext) {
  const config = new AbbreviationConfig();
  const trans = new AbbreviationProvider(config);
  const hover = autorunDisposable(disposables => {
    disposables.push(
      vscode.languages.registerHoverProvider(
        config.languages.get(),
        new AbbreviationHoverProvider(config, trans)
      )
    );
  });
  context.subscriptions.push(hover);
  debugChannel.info('Hover input information added');
  context.subscriptions.push(new AbbreviationRewriterFeature(config, trans));
  debugChannel.info('Abbreviation rewriter registered');
}

/**
 * Sets up everything required for the abbreviation rewriter feature.
 * Creates an `AbbreviationRewriter` for the active editor.
 */
export class AbbreviationRewriterFeature {
  public readonly disposables = new Array<Disposable>();
  private readonly config: AbbreviationConfig;
  private readonly abbreviationProvider: AbbreviationProvider;

  @observable
  private activeTextEditor: TextEditor | undefined;

  constructor(
    private readonly c: AbbreviationConfig,
    abbreviationProvider: AbbreviationProvider
  ) {
    this.activeTextEditor = window.activeTextEditor;
    this.config = c;
    this.abbreviationProvider = abbreviationProvider;
    this.disposables.push(
      autorunDisposable(ds => {
        ds.push(
          window.onDidChangeActiveTextEditor(e => {
            if (e) {
              this.activeTextEditor = e;
              this.activate();
            }
          })
        );
      })
    );
    this.activate();
  }

  public activate(): void {
    this.disposables.push(
      autorunDisposable(disposables => {
        if (
          this.activeTextEditor &&
          this.shouldEnableRewriterForEditor(this.activeTextEditor)
        ) {
          // This creates an abbreviation rewriter for the active text editor.
          // Old rewriters are disposed automatically.
          // This is also updated when this feature is turned off/on.
          const rewriter = new AbbreviationRewriter(
            this.config,
            this.abbreviationProvider,
            this.activeTextEditor
          );
          disposables.push(rewriter);
        }
      })
    );
  }
  private shouldEnableRewriterForEditor(editor: TextEditor): boolean {
    if (!this.config.inputModeEnabled) {
      return false;
    }
    if (!languages.match(this.config.languages.get(), editor.document)) {
      return false;
    }
    return true;
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
