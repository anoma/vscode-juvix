/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/*
 * Adapted from vscode-lean sources.
 * See https://github.com/leanprover/vscode-lean
 */

import * as vscode from 'vscode';
import { autorunDisposable } from '../utils/autorunDisposable';
import { AbbreviationHoverProvider } from './AbbreviationHoverProvider';
import { AbbreviationProvider } from './AbbreviationProvider';
import { AbbreviationRewriterFeature } from './rewriter/AbbreviationRewriterFeature';
import { AbbreviationConfig } from './config';
import * as debug from '../utils/debug';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new AbbreviationFeature());
  // debug.log('info', 'Input method registered');
}

export class AbbreviationFeature {
  private readonly disposables = new Array<vscode.Disposable>();

  constructor() {
    const config = new AbbreviationConfig();
    const abbrevations = new AbbreviationProvider(config);

    this.disposables.push(
      autorunDisposable(disposables => {
        disposables.push(
          vscode.languages.registerHoverProvider(
            config.languages.get(),
            new AbbreviationHoverProvider(config, abbrevations)
          )
        );
      }),
      new AbbreviationRewriterFeature(config, abbrevations)
    );
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
