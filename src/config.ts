/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

export class JuvixConfig {
  private uc: vscode.WorkspaceConfiguration;
  private binaryName: string;
  public revealPanel: string;
  public statusBarIcons: boolean;
  public noColors: boolean;
  public showNameIds: boolean;
  public onlyErrors: boolean;
  public noTermination: boolean;
  public noPositivity: boolean;
  public noStdlib: boolean;

  constructor() {
    this.uc = vscode.workspace.getConfiguration();
    this.binaryName = this.getBinaryName();
    this.statusBarIcons = this.uc.get('juvix-mode.statusBarIcons') ?? true;
    this.revealPanel = this.uc.get('juvix-mode.revealPanel') ?? 'silent';
    this.noColors = this.uc.get('juvix-mode.opts.noColors') ?? false;
    this.showNameIds = this.uc.get('juvix-mode.opts.showNameIds') ?? false;
    this.onlyErrors = this.uc.get('juvix-mode.opts.onlyErrors') ?? false;
    this.noTermination = this.uc.get('juvix-mode.opts.noTermination') ?? false;
    this.noPositivity = this.uc.get('juvix-mode.opts.noPositivity') ?? false;
    this.noStdlib = this.uc.get('juvix-mode.opts.noStdlib') ?? false;
  }

  public getBinaryName(): string {
    return this.uc.get('juvix-mode.bin.name') ?? 'juvix';
  }
  public getCompilationFlags(): string {
    const flags = [];
    flags.push('--target');
    flags.push(this.uc.get('juvix-mode.compilationTarget') ?? 'c');
    flags.push('--runtime');
    flags.push(this.uc.get('juvix-mode.compilationRuntime') ?? 'native');
    const outputFile: string =
      this.uc.get('juvix-mode.compilationOutput') ?? '';
    if (outputFile != '') {
      flags.push('--output');
      flags.push(outputFile);
    }
    return flags.join(' ');
  }
  public getGlobalFlags(): string {
    const flags = [];
    if (this.noColors) {
      flags.push('--no-colors');
    }
    if (this.showNameIds) {
      flags.push('--show-name-ids');
    }
    if (this.onlyErrors) {
      flags.push('--only-errors');
    }
    if (this.noTermination) {
      flags.push('--no-termination');
    }
    if (this.noPositivity) {
      flags.push('--no-positivity');
    }
    if (this.noStdlib) {
      flags.push('--no-stdlib');
    }
    return flags.join(' ');
  }
}
