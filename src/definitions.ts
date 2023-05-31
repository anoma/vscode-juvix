/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { logger } from './utils/debug';
import { GotoProperty } from './interfaces';
import { isJuvixFile } from './utils/base';

export let definitionProvider: vscode.DefinitionProvider;
export let locationMap = new Map<string, Map<number, GotoProperty[]>>();

export async function activate(context: vscode.ExtensionContext) {
  try {
    definitionProvider = new JuvixDefinitionProvider();
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language: 'Juvix', scheme: 'file' },
        definitionProvider
      )
    );
  } catch (error) {
    logger.error('No definition provider:' + error, 'definitions.ts');
  }
}

export class JuvixDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Location | vscode.Location[] | undefined> {
    if (!isJuvixFile(document)) return undefined;
    const filePath = document.fileName;
    const line = position.line;
    const col = position.character;

    const definitionInfo = locationMap.get(filePath);
    if (!definitionInfo) {
      return undefined;
    }

    const definitionsByLine = definitionInfo.get(line);
    if (!definitionsByLine) {
      return undefined;
    }

    for (const info of definitionsByLine)
      if (info.interval.start <= col && info.interval.end >= col) {
        const { targetLine, targetStartCharacter, targetFile } = info;
        const rangeBegin = new vscode.Position(
          targetLine,
          targetStartCharacter
        );
        const lengthIdentifier = info.interval.end - info.interval.start + 1;
        const rangeEnd = new vscode.Position(
          targetLine,
          targetStartCharacter + lengthIdentifier
        );
        const positionRange = new vscode.Range(rangeBegin, rangeEnd);
        const definitionFound = new vscode.Location(
          vscode.Uri.file(targetFile),
          positionRange
        );
        return definitionFound;
      }
  }
}
