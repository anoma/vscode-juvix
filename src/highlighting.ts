/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';

export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
const defLocation = new Map<string, Map<number, TargetLocation[]>>();

interface ColInterval {
  start: number;
  end: number;
}

interface TargetLocation {
  interval: ColInterval;
  targetFile: string;
  targetLine: number;
  targetStartCharacter: number;
}

export const legend = (function () {
  const tokenTypesLegend = [
    'axiom',
    'comment',
    'constructor',
    'error',
    'function',
    'inductive',
    'keyword',
    'module',
    'number',
    'string',
  ];
  tokenTypesLegend.forEach((tokenType, index) =>
    tokenTypes.set(tokenType, index)
  );

  // not used at the moment
  const tokenModifiersLegend = ['declaration', 'documentation'];
  tokenModifiersLegend.forEach((tokenModifier, index) =>
    tokenModifiers.set(tokenModifier, index)
  );

  return new vscode.SemanticTokensLegend(
    tokenTypesLegend,
    tokenModifiersLegend
  );
})();

interface RawInterval {
  file: string;
  line: number;
  startCharacter: number;
  length: number;
}

interface FaceProperty {
  interval: RawInterval;
  tokenType: string;
}

interface InternalHighlightOutput {
  face: [Array<Array<string | number> | string>];
  goto: [[string, number, number, number], string, number, number][];
}

export class Highlighter implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const filePath: string = document.fileName;
    const content: string = document.getText();
    // const contentDisk: string = fs.readFileSync(filePath, 'utf8');

    const { spawnSync } = require('child_process');
    const ls = spawnSync(
      'juvix',
      ['internal', 'highlight', '--format', 'json', filePath, '--stdin'],
      { input: content }
    );

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      vscode.window.showErrorMessage(errMsg);
      throw new Error(errMsg);
    }
    const stdout = ls.stdout;
    const output: InternalHighlightOutput = JSON.parse(stdout.toString());
    const allTokens = output.face;

    defLocation.set(filePath, new Map());
    output.goto.forEach(entry => {
      const line: number = Number(entry[0][1]) - 1;
      const startLoc: number = Number(entry[0][2]) - 1;
      const targetLocation: TargetLocation = {
        interval: {
          start: startLoc,
          end: startLoc + Number(entry[0][3]) - 1,
        },
        targetFile: entry[1].toString(),
        targetLine: Number(entry[2]) - 1,
        targetStartCharacter: Number(entry[3]) - 1,
      };
      if (!defLocation.get(filePath)?.has(line)) {
        defLocation.get(filePath)?.set(line, []);
      } else {
        defLocation.get(filePath)?.get(line)?.push(targetLocation);
      }
    });

    console.log('filePath: ' + filePath);
    console.log('tokens length: ' + allTokens.length);
    const builder = new vscode.SemanticTokensBuilder(legend);
    allTokens.forEach(entry => {
      const tk: FaceProperty = this.getFaceProperty(entry);
      builder.push(
        tk.interval.line,
        tk.interval.startCharacter,
        tk.interval.length,
        this.encodeTokenType(tk.tokenType),
        0
      );
    });
    return builder.build();
  }

  private getFaceProperty(
    entry: ((string | number)[] | string)[]
  ): FaceProperty {
    const intervalInfo = entry[0];
    const rawInterval: RawInterval = {
      file: intervalInfo[0].toString(),
      line: Number(intervalInfo[1]) - 1,
      startCharacter: Number(intervalInfo[2]) - 1,
      length: Number(intervalInfo[3]),
    };
    const token: FaceProperty = {
      interval: rawInterval,
      tokenType: entry[1].toString(),
    };
    return token;
  }

  private encodeTokenType(tokenType: string): number {
    if (tokenTypes.has(tokenType)) {
      return tokenTypes.get(tokenType)!;
    } else if (tokenType === 'notInLegend') {
      return tokenTypes.size + 2;
    }
    return 0;
  }

  private encodeTokenModifiers(strTokenModifiers: string[]): number {
    let result = 0;
    for (let i = 0; i < strTokenModifiers.length; i++) {
      const tokenModifier = strTokenModifiers[i];
      if (tokenModifiers.has(tokenModifier)) {
        result = result | (1 << tokenModifiers.get(tokenModifier)!);
      } else if (tokenModifier === 'notInLegend') {
        result = result | (1 << (tokenModifiers.size + 2));
      }
    }
    return result;
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
    console.log('filePath: ' + filePath);
    if (!defLocation.has(filePath)) {
      console.log('no defLocation for filePath: ' + filePath);
      return undefined;
    } else {
      if (!defLocation.get(filePath)!.has(line)) {
        console.log('no defLocation for line: ' + line);
        return undefined;
      } else {
        const locsByLine: TargetLocation[] = defLocation
          .get(filePath)!
          .get(line)!;
        console.log('checking symbol at: ' + [line, col]);
        console.log('locsByLine: ' + locsByLine);
        for (let i = 0; i < locsByLine.length; i++) {
          const info: TargetLocation = locsByLine[i];
          console.log(
            'char in interval?: ' +
              [
                info.interval.start,
                info.interval.end,
                info.targetFile,
                info.targetLine,
                info.targetStartCharacter,
              ]
          );
          if (info.interval.start <= col && info.interval.end >= col) {
            // check if the target file is in the standrd library
            return new vscode.Location(
              vscode.Uri.file(info.targetFile),
              new vscode.Position(info.targetLine, info.targetStartCharacter)
            );
          }
        }
      }
    }

    return undefined;
  }
}
