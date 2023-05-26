/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { GotoProperty } from './interfaces';

export let definitionProvider: vscode.DefinitionProvider;
export let locationMap = new Map<string, Map<number, GotoProperty[]>>();

export async function activate(context: vscode.ExtensionContext) {
  /* Go to definition  */
  try {
    definitionProvider = new JuvixDefinitionProvider();
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language: 'Juvix', scheme: 'file' },
        definitionProvider
      )
    );
    debugChannel.info('Go to definition registered');
  } catch (error) {
    debugChannel.error('No definition provider', error);
  }
}

export class JuvixDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Location | vscode.Location[] | undefined> {
    const filePath: string = document.fileName;
    const line: number = position.line;
    const col: number = position.character;
    debugChannel.info('Go to definition requested ------------------------');
    debugChannel.info(
      'info',
      'Looking for definition of the symbol at: ' + (line + 1) + ':' + (col + 1)
    );
    debugChannel.info('Active file: ' + filePath);
    const definitionInfo = locationMap.get(filePath);
    if (!definitionInfo) {
      debugChannel.info(
        'There is no definitions registered in file: ' + filePath
      );
      return undefined;
    }
    const definitionsByLine = definitionInfo.get(line);
    if (!definitionsByLine) {
      debugChannel.info(
        'There is no definitions registered in line: ' + (line + 1)
      );
      return undefined;
    }

    const locsByLine: GotoProperty[] = definitionsByLine;
    debugChannel.info(
      '> Found ' + locsByLine.length + ' definitions at line: ' + (line + 1)
    );
    for (let i = 0; i < locsByLine.length; i++) {
      const info: GotoProperty = locsByLine[i];
      debugChannel.info(
        '>> Checking if symbol is between colummns: ' +
        (info.interval.start + 1) +
        ' and ' +
        (info.interval.end + 1)
      );

      if (info.interval.start <= col && info.interval.end >= col) {
        debugChannel.info('info', '[!] Found definition at: ' +
          info.targetFile + ':' + (info.targetLine + 1) + ':'
          + (info.targetStartCharacter + 1));
        const rangeBegin = new vscode.Position(
          info.targetLine,
          info.targetStartCharacter
        );
        const lengthIdentifier = info.interval.end - info.interval.start + 1;
        const rangeEnd = new vscode.Position(
          info.targetLine,
          info.targetStartCharacter + lengthIdentifier
        );
        const positionRange = new vscode.Range(rangeBegin, rangeEnd);
        const definitionFound = new vscode.Location(
          vscode.Uri.file(info.targetFile),
          positionRange
        );
        return definitionFound;
      }
    }
  }
}
