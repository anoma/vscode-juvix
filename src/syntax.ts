/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

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
  const tokenModifiersLegend = [
    'declaration',
    'documentation',
  ];
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

interface GotoProperty {
  interval: RawInterval;
  targetFile: string;
  targetLine: number;
  targetStartCharacter: number;
}

interface InternalHighlightOutput {
  face: [Array<Array<string | number> | string>];
  goto: any[];
}

export class Highlighter implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const filePath: string = document.fileName;
    const { spawnSync } = require('child_process');
    const ls = spawnSync('juvix', ['internal', 'highlight', "--format", "json",filePath]);
    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      vscode.window.showErrorMessage(errMsg);
      throw new Error(errMsg);
    }
    const stdout = ls.stdout;
    const output: InternalHighlightOutput = JSON.parse(stdout.toString());
    const allTokens = output.face;
    const builder = new vscode.SemanticTokensBuilder();
    allTokens.forEach(entry => {
      const tk: FaceProperty = this.getFaceProperty(entry);
      builder.push(
        tk.interval.line,
        tk.interval.startCharacter,
        tk.interval.length,
        this._encodeTokenType(tk.tokenType),
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
      line: Number(intervalInfo[1]) -1,
      startCharacter: Number(intervalInfo[2])-1,
      length: Number(intervalInfo[3]) -1 ,
    };
    const token: FaceProperty = {
      interval: rawInterval,
      tokenType: entry[1].toString(),
    };
    return token;
  }

  private _encodeTokenType(tokenType: string): number {
    if (tokenTypes.has(tokenType)) {
      return tokenTypes.get(tokenType)!;
    } else if (tokenType === 'notInLegend') {
      return tokenTypes.size + 2;
    }
    return 0;
  }

  private _encodeTokenModifiers(strTokenModifiers: string[]): number {
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
