/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

export interface GlobalOptions {
  noColors: boolean;
  showNameIds: boolean;
  onlyErrors: boolean;
  noTermination: boolean;
  noPositivity: boolean;
  noStdlib: boolean;
}

export class JuvixConfig {
  private uc: vscode.WorkspaceConfiguration;
  private globalOptions: GlobalOptions;
  private binaryName: string;

  constructor() {
    this.uc = vscode.workspace.getConfiguration();
    this.binaryName = this.getBinaryName();
    this.globalOptions = this.getGlobalOptions();
  }

  public getBinaryName(): string {
    return this.uc.get('juvix-mode.bin.name') ?? 'juvix';
  }

  public getGlobalOptions(): GlobalOptions {
    return {
      noColors: this.uc.get('juvix-mode.globalOptions.noColors') ?? false,
      showNameIds: this.uc.get('juvix-mode.globalOptions.showNameIDs') ?? false,
      onlyErrors: this.uc.get('juvix-mode.globalOptions.noColors') ?? false,
      noTermination: this.uc.get('juvix-mode.globalOptions.noColors') ?? false,
      noPositivity: this.uc.get('juvix-mode.globalOptions.noColors') ?? false,
      noStdlib: this.uc.get('juvix-mode.globalOptions.noColors') ?? false,
    };
  }
}
