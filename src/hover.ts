/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { logger } from './utils/debug';
import { RawInterval, HoverProperty } from './interfaces';

export let hoverProvider: vscode.HoverProvider;
export const hoverMap = new Map<string, Map<number, HoverProperty[]>>();

export async function activate(_context: vscode.ExtensionContext) {
  try {
    hoverProvider = new JuvixHoverProvider();
    vscode.languages.registerHoverProvider(
      { language: 'Juvix', scheme: 'file' },
      hoverProvider
    );
  } catch (error) {
    logger.error('No hover provider' + error, 'hover.ts');
  }
}

export class JuvixHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ) {
    const filePath: string = document.fileName;
    const line: number = position.line;
    const col: number = position.character;
    const hoversByFile = hoverMap.get(filePath);
    if (!hoversByFile) {
      return undefined;
    }
    const hoversByLine = hoversByFile.get(line);
    if (!hoversByLine) {
      return undefined;
    }

    for (let i = 0; i < hoversByLine.length; i++) {
      const hoverProperty: HoverProperty = hoversByLine[i];
      if (
        hoverProperty.interval.startCol <= col &&
        col <= hoverProperty.interval.endCol
      ) {
        const enhancedText = new vscode.MarkdownString(hoverProperty.text);
        enhancedText.isTrusted = true;
        enhancedText.supportHtml = true;
        const hover = new vscode.Hover(
          enhancedText,
          new vscode.Range(
            new vscode.Position(
              hoverProperty.interval.line,
              hoverProperty.interval.startCol
            ),
            new vscode.Position(
              hoverProperty.interval.endLine,
              hoverProperty.interval.endCol
            )
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
