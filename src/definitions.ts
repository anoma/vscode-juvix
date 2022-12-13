/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import * as debug from './utils/debug';

export let definitionProvider: vscode.DefinitionProvider;
export let locationMap = new Map<string, Map<number, TargetLocation[]>>();

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

export function activate(context: vscode.ExtensionContext) {
  /* Go to definition  */
  try {
    definitionProvider = new JuvixDefinitionProvider();
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language: 'Juvix', scheme: 'file' },
        definitionProvider
      )
    );
    debug.log('info', 'Go to definition registered');
  } catch (error) {
    debug.log('error', 'No definition provider', error);
  }
}

export class JuvixDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[] | undefined> {
    const filePath: string = document.fileName;
    const line = position.line;
    const col: number = position.character;
    debug.log('info', 'Definition requested ------------------------');
    debug.log('info', 'Looking for definition at: ' + line + ':' + col);
    debug.log('info', 'Active file: ' + filePath);
    if (!locationMap.has(filePath)) {
      debug.log('info', 'There is no definitions registered in file: ' + filePath);
      return undefined;
    } else {
      if (!locationMap.get(filePath)!.has(line)) {
        debug.log('info', 'There is no defnition registered at line: ' + line);
        return undefined;
      } else {
        const locsByLine: TargetLocation[] = locationMap
          .get(filePath)!
          .get(line)!;
        for (let i = 0; i < locsByLine.length; i++) {
          const info: TargetLocation = locsByLine[i];
          debug.log('info', 'Checking if symbol is between colummns: ' +
            info.interval.start + ' and ' + info.interval.end);
            
          if (info.interval.start <= col && info.interval.end >= col) {
            debug.log('info', 'Found definition at: ' + info.targetFile + ':' +
              info.targetLine + ':' + info.targetStartCharacter);
            let definitionFound = new vscode.Location(
              vscode.Uri.file(info.targetFile),
              new vscode.Position(info.targetLine, info.targetStartCharacter)
            );
            return definitionFound;
          }
        }
      }
    }
    debug.log('info', 'No definition found');
    return undefined;
  }
}
