/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { JuvixConfig } from './config';
import { debugChannel } from './utils/debug';
import * as def from './definitions';
import { spawnSync } from 'child_process';
import { startBatch } from 'mobx/dist/internal';

/*
Semantic syntax highlighting
*/

export async function activate(context: vscode.ExtensionContext) {
  const config = new JuvixConfig();
  if (!config.enableSemanticSyntax.get()) return;
  try {
    const semanticTokensProvider = new Highlighter();
    const highlighterProvider =
      vscode.languages.registerDocumentSemanticTokensProvider(
        { language: 'Juvix', scheme: 'file' },
        semanticTokensProvider,
        legend
      );
    context.subscriptions.push(highlighterProvider);
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('juvix-mode.enableSemanticSyntax')) {
          if (!config.enableSemanticSyntax.get()) highlighterProvider.dispose();
          else activate(context);
        }
      })
    );
    debugChannel.debug('Semantic syntax highlighter registered');
  } catch (error) {
    debugChannel.error('No semantic provider', error);
  }
}

export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();

export const legend: vscode.SemanticTokensLegend = (function () {
  const tokenTypesLegend = [
    'axiom',
    'comment',
    'constructor',
    'error',
    'function',
    'type',
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
  endLine: number;
  endCol: number;
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
    _token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const filePath: string = document.fileName;
    const content: string = document.getText();
    const contentLines: string[] = content.split('\n');

    const config = new JuvixConfig();

    const highlighterCall = [
      config.getJuvixExec(),
      config.getGlobalFlags(),
      'dev',
      'highlight',
      '--format',
      'json',
      filePath,
      '--stdin',
    ].join(' ');

    debugChannel.info('Highlighter call: ' + highlighterCall);

    const ls = spawnSync(highlighterCall, {
      input: content,
      shell: true,
      encoding: 'utf8',
    });

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      debugChannel.error('highlighting provider error', errMsg);
      throw new Error(errMsg);
    }
    const stdout = ls.stdout;
    const output: DevHighlightOutput = JSON.parse(stdout.toString());
    // too verbose but useful for debugging location mapping
    // debugChannel.debug(
    //   'Highlighting output: ' + JSON.stringify(output, null, 2)
    // );

    def.locationMap.set(filePath, new Map());
    output.goto.forEach(entry => {
      // The juvix's output is 1-indexed and vscode's is 0-indexed
      const line: number = Number(entry[0][1]) - 1;
      const startLoc: number = Number(entry[0][2]) - 1;
      const targetLocation: def.TargetLocation = {
        interval: {
          start: startLoc,
          end: startLoc + Number(entry[0][3]) - 1,
        },
        targetFile: entry[1][0].toString(),
        targetLine: Number(entry[1][1]) - 1,
        targetStartCharacter: Number(entry[1][2]) - 1,
      };
      if (!def.locationMap.get(filePath)?.get(line)) {
        def.locationMap.get(filePath)?.set(line, []);
      }
      def.locationMap.get(filePath)?.get(line)?.push(targetLocation);
    });

    // // too verbose but useful for debugging location mapping
    // debugChannel.debug(
    //   'Highlighting output: ' +
    //     JSON.stringify(def.locationMap.get(filePath)?.get(36), null, 2)
    // );

    debugChannel.debug('Active file: ' + filePath);

    const allTokens = output.face;
    debugChannel.debug('> Tokens length: ' + allTokens.length);

    const builder = new vscode.SemanticTokensBuilder(legend);
    allTokens.forEach(entry => {
      const tk: FaceProperty = this.getFaceProperty(entry);
      const token = this.encodeTokenType(tk.tokenType);
      for (let l = tk.interval.line; l <= tk.interval.endLine; l++) {
        const startCol = l == tk.interval.line ? tk.interval.startCharacter : 0;
        const lineLength =
          l == tk.interval.endLine
            ? l == tk.interval.line
              ? tk.interval.length
              : tk.interval.endCol
            : contentLines[l].length;
        // lineLength represent the number of symbols we can see on the screen.
        // However, in js, length for unicode symbols works not as expected, but
        // rather shows the code units number.
        // So we need to actually calculate all the code units.
        // In case of the unicode symbol, we need to take 2 positions instead of one.
        // With this in mind, we recalculate length and start position for the token.

        const newStartCol =
          startCol + this.numberOfAstralSymbols(contentLines[l], 0, startCol);

        const realLength =
          lineLength +
          this.numberOfAstralSymbols(
            contentLines[l],
            newStartCol,
            newStartCol + lineLength
          );

        builder.push(l, newStartCol, realLength, token, 0);
      }
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
      length: Number(intervalInfo[3]) - 1,
      endLine: Number(intervalInfo[4]) - 1,
      endCol: Number(intervalInfo[5]) - 1,
    };
    const token: FaceProperty = {
      interval: rawInterval,
      tokenType: entry[1].toString(),
    };
    return token;
  }
  private numberOfAstralSymbols(
    str: string,
    start: number,
    end: number
  ): number {
    // Regular expression to match astral symbols
    const regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

    // Initialize current and previous end positions
    let previousEnd = end;
    let currentEnd = end;

    // Find the new end position by counting the number of astral symbols
    do {
      previousEnd = currentEnd;
      const count = str.substring(start, previousEnd).match(regexAstralSymbols);
      const numAstralSymbols = count ? count.length : 0;
      currentEnd = end + numAstralSymbols;
    } while (previousEnd !== currentEnd);

    // If the new end position is within an astral symbol, move it one position to the right
    if (str.substring(currentEnd, currentEnd + 1).match(regexAstralSymbols)) {
      currentEnd += 1;
    }

    // Return the number of astral symbols
    return currentEnd - end;
  }

  private encodeTokenType(tokenType: string): number {
    if (tokenTypes.has(tokenType)) {
      return tokenTypes.get(tokenType)!;
    } else if (tokenType === 'notInLegend') {
      return tokenTypes.size + 2;
    }
    return 0;
  }
}
