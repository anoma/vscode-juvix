/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

interface GlobalOptions {
  noColors: boolean;
  showNameIds: boolean;
  onlyErrors: boolean;
  noTermination: boolean;
  noPositivity: boolean;
  noStdlib: boolean;
}

class JuvixConfig {
  private vscodeConfig: vscode.WorkspaceConfiguration;
  private globalOptions: GlobalOptions;
  private binaryName: string;

  constructor() {
    this.vscodeConfig = vscode.workspace.getConfiguration();
    this.binaryName = this.getBinaryName();
    this.globalOptions = this.getGlobalOptions();
  }

  public getBinaryName(): string {
    return this.vscodeConfig.get('juvix-mode.bin.name') ?? 'juvix';
  }

  public getGlobalOptions(): GlobalOptions {
    return {
      noColors: false,
      showNameIds: false,
      onlyErrors: false,
      noTermination: false,
      noPositivity: false,
      noStdlib: false,
    };
  }
}
