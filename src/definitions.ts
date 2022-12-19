/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';

export let definitionProvider: vscode.DefinitionProvider;
export const locationMap = new Map<string, Map<number, TargetLocation[]>>();

export interface ColInterval {
  start: number;
  end: number;
}

export interface TargetLocation {
  interval: ColInterval;
  targetFile: string;
  targetLine: number;
  targetStartCharacter: number;
}

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
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[] | undefined> {
    const filePath: string = document.fileName;
    const line: number = position.line;
    const col: number = position.character;
    debugChannel.debug('Find def. requested ------------------------');
    debugChannel.debug(
      'info',
      'Looking for definition of the symbol at: ' + (line + 1) + ':' + (col + 1)
    );
    debugChannel.debug('Active file: ' + filePath);

    if (!locationMap.has(filePath)) {
      debugChannel.debug(
        'There is no definitions registered in file: ' + filePath
      );
      return undefined;
    } else {
      if (!locationMap.get(filePath)!.has(line)) {
        debugChannel.debug(
          'There is no defnition registered at line: ' + (line + 1)
        );
        return undefined;
      } else {
        const locsByLine: TargetLocation[] = locationMap
          .get(filePath)!
          .get(line)!;
        debugChannel.debug(
          '> Found ' + locsByLine.length + ' definitions at line: ' + (line + 1)
        );
        for (let i = 0; i < locsByLine.length; i++) {
          const info: TargetLocation = locsByLine[i];
          debugChannel.debug(
            '>> Checking if symbol is between colummns: ' +
              (info.interval.start + 1) +
              ' and ' +
              (info.interval.end + 1)
          );

          if (info.interval.start <= col && info.interval.end >= col) {
            debugChannel.debug(
              'info',
              '[!] Found definition at: ' +
                info.targetFile +
                ':' +
                (info.targetLine + 1) +
                ':' +
                (info.targetStartCharacter + 1)
            );
            const definitionFound = new vscode.Location(
              vscode.Uri.file(info.targetFile),
              new vscode.Position(info.targetLine, info.targetStartCharacter)
            );
            return definitionFound;
          }
        }
      }
    }
    debugChannel.debug('No definition found');
    return undefined;
  }
}
