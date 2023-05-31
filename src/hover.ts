/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { logger } from './utils/debug';
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
    logger.trace('Hover info registered');
  } catch (error) {
    logger.error('No hover provider'+ error);
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
    // log.trace('Hover requested ------------------------');
    // log.trace(
    //   'info',
    //   'In file: ' + filePath + ' at: ' + (line + 1) + ':' + (col + 1)
    // );
    const hoversByFile = hoverMap.get(filePath);
    if (!hoversByFile) {
      // log.trace(
      //   'There is no hover info registered in file: ' + filePath
      // );
      return undefined;
    }
    const hoversByLine = hoversByFile.get(line);
    if (!hoversByLine) {
      // log.trace(
      //   'There is no definitions registered in line: ' + (line + 1)
      // );
      return undefined;
    }

    // log.trace(
    //   '> Found ' + hoversByLine.length + ' hovers at line: ' + (line + 1)
    // );

    for (let i = 0; i < hoversByLine.length; i++) {
      const hoverProperty: HoverProperty = hoversByLine[i];
      if (hoverProperty.interval.startCol <= col && col <= hoverProperty.interval.endCol) {
        logger.trace('info', 'Hover text: ' + hoverProperty.text);
        logger.trace('info', 'Hover interval: ' + JSON.stringify(hoverProperty.interval));
        logger.trace('col', col.toString());
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
