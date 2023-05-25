/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { RawInterval, HoverProperty } from './interfaces';

export let hoverProvider: vscode.HoverProvider;
export let hoverMap = new Map<string, Map<vscode.Position, HoverProperty[]>>();

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
    const filePath: string = document.fileName;
    debugChannel.info('Hover requested ------------------------');
    debugChannel.info(
      'info',
      'Looking for hover info of the symbol at: ' + (position.line + 1) + ':' + (position.character + 1)
    );
    debugChannel.info('Active file: ' + filePath);
    const hoverInfo = hoverMap.get(filePath);
    if (!hoverInfo) {
      debugChannel.info(
        'There is no hover info registered in file: ' + filePath
      );
      return undefined;
    }
    // const hoverProperty = hoverInfo.get(position);
    // if (!hoverProperty) {
    //   debugChannel.info(
    //     'There is no hover info registered in file: ' + filePath
    //   );
    //   return undefined;
    // }
    // const hoverText = hoverProperty.text;
    // debugChannel.info('Hover info found: ' + hoverText);
    // return new vscode.Hover({
    //   language: "Markdown",
    //   value: hoverText
    // });
  }
}

export function getHoverProperty(
    entry: ((string | number)[] | string)[]
  ): HoverProperty {
    const intervalInfo = entry[0];
    const rawInterval: RawInterval = {
      file: intervalInfo[0].toString(),
      line: Number(intervalInfo[1]) - 1,
      startCharacter: Number(intervalInfo[2]) - 1,
      length: Number(intervalInfo[3]) - 1,
      endLine: Number(intervalInfo[4]) - 1,
      endCol: Number(intervalInfo[5]) - 1,
    };
    const hover: HoverProperty = {
      interval: rawInterval,
      text: entry[1].toString(),
    };
    return hover;
  }
