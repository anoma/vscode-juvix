/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as def from './definitions';
import * as hover from './hover';
import * as vscode from 'vscode';
import { logger } from './utils/debug';
import { FaceProperty, GotoProperty, RawInterval, DevHighlightOutput, HoverProperty } from './interfaces';
import { JuvixConfig } from './config';
import { spawnSync } from 'child_process';

/*
The Juvix compiler outputs a JSON file with the following structure:
{
  "face": .. // for syntax highlighting
  "goto": .. // for go to definition
  "doc": ..  // for hover info
}.

We therefore call only once the compiler and then we parse the output
to get the information we need. For "goto" and "doc" feature, we have a
map that associates a file path to the corresponding information for that file.
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
  } catch (error) {
    logger.error(
      'Juvix: Could not register semantic syntax highlighter\n'
      + error
      , 'highlighting.ts'
    );
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


export class Highlighter implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const filePath: string = document.fileName;
    const content: string = document.getText();
    const contentLines: string[] = content.split('\n');

    const config = new JuvixConfig();

    /*
      Call the highlighter
    */
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

    logger.trace('Highlighter call: ' + highlighterCall);

    const ls = spawnSync(highlighterCall, {
      input: content,
      shell: true,
      encoding: 'utf8',
    });

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      vscode.window.showErrorMessage(errMsg);
      throw new Error(errMsg);
    }
    const stdout = ls.stdout;
    const output: DevHighlightOutput = JSON.parse(stdout.toString());

    logger.trace('Highlighting output: ' + JSON.stringify(output, null, 2));

    /*
      Populate the location map for the Goto feature
    */
    def.locationMap.set(filePath, new Map());
    output.goto.forEach(entry => {
      // The juvix's output is 1-indexed and vscode's is 0-indexed
      const line: number = Number(entry[0][1]) - 1;
      const startLoc: number = Number(entry[0][2]) - 1;
      const targetLocation: GotoProperty = {
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

    /*
      Populate the hover map for the Hover feature
    */

    hover.hoverMap.set(filePath, new Map());
    output.doc.forEach(entry => {
      const hoverInfo: HoverProperty = hover.getHoverProperty(entry);
      const line = hoverInfo.interval.line;
      const fileHoverMap = hover.hoverMap.get(filePath);
      if (!fileHoverMap?.get(line)) fileHoverMap?.set(line, []);
      fileHoverMap?.get(line)?.push(hoverInfo);
    });

    /*
      The actual tokenization and syntax highlighting
    */
    const allTokens = output.face;
    // log.debug('> Tokens length: ' + allTokens.length);

    const builder = new vscode.SemanticTokensBuilder(legend);
    allTokens.forEach(entry => {
      const tk: FaceProperty = this.getFaceProperty(entry);
      const token = this.encodeTokenType(tk.tokenType);
      for (let l = tk.interval.line; l <= tk.interval.endLine; l++) {
        const startCol = l == tk.interval.line ? tk.interval.startCol : 0;
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
    } else if (tokenType === 'judoc') {
      return tokenTypes.get('comment')!;
    } else if (tokenType === 'notInLegend') {
      return tokenTypes.size + 2;
    }
    return 0;
  }


  private getFaceProperty(
    entry: ((string | number)[] | string)[]
  ): FaceProperty {
    const intervalInfo = entry[0];
    const rawInterval: RawInterval = {
      file: intervalInfo[0].toString(),
      line: Number(intervalInfo[1]) - 1,
      startCol: Number(intervalInfo[2]) - 1,
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
}
