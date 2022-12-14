/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';
import * as vscode from 'vscode';

export let config: JuvixConfig;

export function getConfig() {
  config = new JuvixConfig();
  return config;
}

export class JuvixConfig {
  public uc: vscode.WorkspaceConfiguration;

  constructor() {
    this.uc = vscode.workspace.getConfiguration(
      'extension',
      vscode.window.activeTextEditor?.document.uri
    );
  }

  public binaryName(): string {
    return this.uc.get('juvix-mode.bin.name') ?? 'juvix';
  }

  public binaryPath(): string {
    return this.uc.get('juvix-mode.bin.path') ?? '';
  }

  public getJuvixExec(): string {
    return this.binaryPath() + this.binaryName();
  }

  public statusBarIcons(): boolean {
    return this.uc.get('juvix-mode.statusBarIcons') ?? false;
  }
  public revealPanel(): string {
    return this.uc.get('juvix-mode.revealPanel') ?? 'always';
  }
  public noColors(): boolean {
    return this.uc.get('juvix-mode.opts.noColors') ?? false;
  }
  public showNameIds(): boolean {
    return this.uc.get('juvix-mode.opts.showNameIds') ?? false;
  }
  public onlyErrors(): boolean {
    return this.uc.get('juvix-mode.opts.onlyErrors') ?? false;
  }
  public noTermination(): boolean {
    return this.uc.get('juvix-mode.opts.noTermination') ?? false;
  }
  public noPositivity(): boolean {
    return this.uc.get('juvix-mode.opts.noPositivity') ?? false;
  }
  public noStdlib(): boolean {
    return this.uc.get('juvix-mode.opts.noStdlib') ?? false;
  }

  public getCompilationFlags(): string {
    const flags = [];
    flags.push('--target');
    flags.push(this.uc.get('juvix-mode.compilationTarget'));
    flags.push('--runtime');
    flags.push(this.uc.get('juvix-mode.compilationRuntime'));
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
    if (this.noColors()) {
      flags.push('--no-colors');
    }
    if (this.showNameIds()) {
      flags.push('--show-name-ids');
    }
    if (this.onlyErrors()) {
      flags.push('--only-errors');
    }
    if (this.noTermination()) {
      flags.push('--no-termination');
    }
    if (this.noPositivity()) {
      flags.push('--no-positivity');
    }
    if (this.noStdlib()) {
      flags.push('--no-stdlib');
    }
    return flags.join(' ');
  }

  public toString = (): string => {
    return `JuvixConfig {
     binaryName: ${this.binaryName()},
     binaryPath: ${this.binaryPath()},
     juvixExec: ${this.getJuvixExec()},
     statusBarIcons: ${this.statusBarIcons()},
     revealPanel: ${this.revealPanel()},
     noColors: ${this.noColors()},
     showNameIds: ${this.showNameIds()},
     onlyErrors: ${this.onlyErrors()},
     noTermination: ${this.noTermination()},
     noPositivity: ${this.noPositivity()},
     noStdlib: ${this.noStdlib()},
     compilationFlags: ${this.getCompilationFlags()},
     globalFlags: ${this.getGlobalFlags()}
    }`;
  };
}
