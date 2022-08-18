/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

export class GlobalOptions {
  private uc : vscode.WorkspaceConfiguration;

  public noColors: boolean = false;
  public showNameIds: boolean = false;
  public onlyErrors: boolean = false;
  public noTermination: boolean = false;
  public noPositivity: boolean = false;
  public noStdlib: boolean = false;
  constructor() {
    this.uc = vscode.workspace.getConfiguration();
  }
  public getGlobalOptions()  {
    return {
      noColors : this.uc.get('juvix-mode.globalOptions.noColors'),
      showNameIds : this.uc.get('juvix-mode.globalOptions.showNameIDs'),
      onlyErrors : this.uc.get('juvix-mode.globalOptions.noColors'),
      noTermination : this.uc.get('juvix-mode.globalOptions.noColors'),
      noPositivity : this.uc.get('juvix-mode.globalOptions.noColors'),
      noStdlib : this.uc.get('juvix-mode.globalOptions.noColors')
    }
  }

  public toString() {
    const flags = [];
    if (this.noColors) { flags.push('--no-colors'); }
    if (this.showNameIds) { flags.push('--show-name-ids'); }
    if (this.onlyErrors) { flags.push('--only-errors'); }
    if (this.noTermination) { flags.push('--no-termination'); }
    if (this.noPositivity) { flags.push('--no-positivity'); }
    if (this.noStdlib) { flags.push('--no-stdlib'); }
    return flags.join(' ');
  }
}

export class JuvixConfig {
  private uc: vscode.WorkspaceConfiguration;
  private globalOptions: GlobalOptions;
  private binaryName: string;

  constructor() {
    this.uc = vscode.workspace.getConfiguration();
    this.binaryName = this.getBinaryName();
    this.globalOptions = new GlobalOptions();
  }

  public getBinaryName(): string {
    return this.uc.get('juvix-mode.bin.name') ?? 'juvix';
  }

  public getGlobalFlags() : string {
    return this.globalOptions.toString();
  }
}
