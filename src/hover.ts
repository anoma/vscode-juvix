/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { RawInterval, HoverProperty } from './interfaces';

export let hoverProvider: vscode.HoverProvider;
export let hoverMap = new Map<string, Map<number, HoverProperty[]>>();

export async function activate(_context: vscode.ExtensionContext) {
  try {
    hoverProvider = new JuvixHoverProvider();
    vscode.languages.registerHoverProvider(
      { language: 'Juvix', scheme: 'file' },
      hoverProvider
    )
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
    // debugChannel.info('Hover requested ------------------------');
    // debugChannel.info(
    //   'info',
    //   'In file: ' + filePath + ' at: ' + (line + 1) + ':' + (col + 1)
    // );
    const hoversByFile = hoverMap.get(filePath);
    if (!hoversByFile) {
      // debugChannel.info(
      //   'There is no hover info registered in file: ' + filePath
      // );
      return undefined;
    }
    const hoversByLine = hoversByFile.get(line);
    if (!hoversByLine) {
      // debugChannel.info(
      //   'There is no definitions registered in line: ' + (line + 1)
      // );
      return undefined;
    }

    // debugChannel.info(
    //   '> Found ' + hoversByLine.length + ' hovers at line: ' + (line + 1)
    // );

    for (let i = 0; i < hoversByLine.length; i++) {
      const hoverProperty: HoverProperty = hoversByLine[i];
      if (hoverProperty.interval.startCol <= col && col <= hoverProperty.interval.endCol) {
        debugChannel.info('info', 'Hover text: ' + hoverProperty.text);
        debugChannel.info('info', 'Hover interval: ' + JSON.stringify(hoverProperty.interval));
        debugChannel.info('col', col.toString());
        let enhancedText = new vscode.MarkdownString(
          hoverProperty.text
        );
        enhancedText.isTrusted = true;
        enhancedText.supportHtml = true;
        let hover = new vscode.Hover(enhancedText, new vscode.Range(
          new vscode.Position(hoverProperty.interval.line, hoverProperty.interval.startCol),
          new vscode.Position(hoverProperty.interval.endLine, hoverProperty.interval.endCol)
        )
        );
        return hover;
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
