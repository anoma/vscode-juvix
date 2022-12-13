/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import { JuvixConfig } from './config';
import * as debug from './utils/debug';
import * as def from './definitions';

export function activate(context: vscode.ExtensionContext) {
  /*
    Semantic syntax highlight
  */
  try {
    const semanticTokensProvider = new Highlighter();
    context.subscriptions.push(
      vscode.languages.registerDocumentSemanticTokensProvider(
        { language: 'Juvix', scheme: 'file' },
        semanticTokensProvider,
        legend
      )
    );
    debug.log('info', 'Semantic syntax highlighter registered');
  } catch (error) {
    debug.log('error', 'No semantic provider', error);
  }
}

export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();

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

interface DevHighlightOutput {
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
    const config = new JuvixConfig();
    const { spawnSync } = require('child_process');
    const ls = spawnSync(
      config.getJuvixExec(),
      ['dev', 'highlight', '--format', 'json', filePath, '--stdin'],
      { input: content }
    );

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      vscode.window.showErrorMessage(errMsg);
      throw new Error(errMsg);
    }
    const stdout = ls.stdout;
    const output: DevHighlightOutput = JSON.parse(stdout.toString());
    const allTokens = output.face;

    def.locationMap.set(filePath, new Map());
    output.goto.forEach(entry => {
      const line: number = Number(entry[0][1]) - 1;
      const startLoc: number = Number(entry[0][2]) - 1;
      const targetLocation: def.TargetLocation = {
        interval: {
          start: startLoc,
          end: startLoc + Number(entry[0][3]) - 1,
        },
        targetFile: entry[1].toString(),
        targetLine: Number(entry[2]) - 1,
        targetStartCharacter: Number(entry[3]) - 1,
      };
      if (!def.locationMap.get(filePath)?.has(line)) {
        def.locationMap.get(filePath)?.set(line, []);
      } else {
        def.locationMap.get(filePath)?.get(line)?.push(targetLocation);
      }
    });

    debug.log('info', 'Active file: ' + filePath);
    debug.log('info', '> Tokens length: ' + allTokens.length);

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
