/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

export interface RawInterval {
    file: string;
    line: number;
    startCol: number;
    length: number;
    endLine: number;
    endCol: number;
  }

  export interface FaceProperty {
    interval: RawInterval;
    tokenType: string;
  }

  export interface HoverProperty {
    interval: RawInterval;
    text: string;
  }

  export interface DevHighlightOutput {
    face: [Array<Array<string | number> | string>];
    goto: [[string, number, number, number], string, number, number][];
    doc: [[string, number, number, number,number, number], string][];
  }


export interface ColInterval {
  start: number;
  end: number;
}

export interface GotoProperty {
  interval: ColInterval;
  targetFile: string;
  targetLine: number;
  targetStartCharacter: number;
}
