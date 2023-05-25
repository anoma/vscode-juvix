/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { RawInterval } from './interfaces';

export let hoverProvider: vscode.HoverProvider;
export let hoverMap = new Map<string, Map<number, HoverProperty[]>>();

export interface HoverProperty {
  interval: RawInterval;
  tokenType: string;
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    hoverProvider = new JuvixHoverProvider();
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        { language: 'Juvix', scheme: 'file' },
        hoverProvider
      )
    );
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: 'Juvix', scheme: 'file' },
        new JuvixHoverProvider())
    );
    debugChannel.info('Hover info registered');
  } catch (error) {
    debugChannel.error('No hover provider', error);
  }
}
export class JuvixHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument
      , position: vscode.Position
      , _token: vscode.CancellationToken
    ) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);
      return new vscode.Hover({
        language: "Juvix",
        value: "Hello!"
      });
    }
  }