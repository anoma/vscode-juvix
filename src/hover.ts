/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { RawInterval, HoverProperty } from './interfaces';

export let hoverProvider: vscode.HoverProvider;
export let hoverMap = new Map<string, Map<number, HoverProperty[]>>();

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
    const line: number = position.line;
    const col: number = position.character;
    debugChannel.info('Hover requested ------------------------');
    debugChannel.info(
      'info',
      'In file: ' + filePath + ' at: ' + (line + 1) + ':' + (col + 1)
    );
    const hoversByFile = hoverMap.get(filePath);
    if (!hoversByFile) {
      debugChannel.info(
        'There is no hover info registered in file: ' + filePath
      );
      return undefined;
    }
    const hoversByLine = hoversByFile.get(line);
    if (!hoversByLine) {
      debugChannel.info(
        'There is no definitions registered in line: ' + (line + 1)
      );
      return undefined;
    }

    debugChannel.info(
      '> Found ' + hoversByLine.length + ' hovers at line: ' + (line + 1)
    );
    for (let i = 0; i < hoversByLine.length; i++) {
      const hover: HoverProperty = hoversByLine[i];
      if (hover.interval.startCol <= col && col <= hover.interval.endCol) {
        debugChannel.info('info', '[!] Found definition at: ' +
          hover.interval.file + ':' + (hover.interval.line + 1)
          + ':' + (hover.interval.startCol + 1));

        return new vscode.Hover({
          language: "Markdown",
          value: hover.text
        });
      }
    }
    return undefined;
  }
}

export function getHoverProperty(
  entry: ((string | number)[] | string)[]
): HoverProperty {
  const intervalInfo = entry[0];
  const rawInterval: RawInterval = {
    file: intervalInfo[0].toString(),
    line: Number(intervalInfo[1]) - 1,
    startCol: Number(intervalInfo[2]) - 1,
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
