'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { logger } from './utils/debug';
import { ConfigurationTarget, workspace } from 'vscode';

export class JuvixConfig {
  private workspaceConfig = workspace.getConfiguration('juvix-mode');
  public _binaryPath = this.workspaceConfig.get('juvixBinPath', '');
  public _binaryName = this.workspaceConfig.get('juvixBinName', 'juvix');

  // Binary configuration methods
  public binaryName(): string {
    return this._binaryName;
  }

  public binaryPath(): string {
    return this._binaryPath;
  }

  public setBinaryPath(value: string): void {
    this._binaryPath = value;
    this.workspaceConfig.update(
      'juvixBinPath',
      value,
      ConfigurationTarget.Workspace,
    );
  }

  public setBinaryName(value: string): void {
    this._binaryName = value;
    this.workspaceConfig.update(
      'juvixBinName',
      value,
      ConfigurationTarget.Workspace,
    );
  }

  public getJuvixExec(): string {
    const binPath = this.binaryPath();
    const binName = this.binaryName();
    return path.join(binPath, binName);
  }

  // Clean configuration methods
  public needGlobalClean(): boolean {
    return this.workspaceConfig.get('juvixClean', false);
  }

  public getCleanFlags(): string {
    const globalClean = this.needGlobalClean();
    if (globalClean) return '--global';
    return '';
  }

  // Typecheck configuration methods
  public typecheckExtraArgs(): string {
    return this.workspaceConfig.get('typecheckExtraArgs', '');
  }

  public typecheckOnChange(): boolean {
    return this.workspaceConfig.get('typecheckOnChange', false);
  }

  public getTypeckeckFlags(): string {
    const flags: string[] = [];
    const extraArgs = this.typecheckExtraArgs();
    if (extraArgs) {
      for (const arg of extraArgs.split(' ')) {
        flags.push(arg);
      }
    }
    const typecheckFlags = flags.join(' ').trim();
    return typecheckFlags;
  }

  public typecheckOn(): string {
    return this.workspaceConfig.get('typecheckOn', '');
  }

  // Compilation configuration methods
  public compilationExtraArgs(): string {
    return this.workspaceConfig.get('compilationExtraArgs', '');
  }

  public compilationTarget(): string {
    return this.workspaceConfig.get('compilationTarget', 'native');
  }

  public compilationOutput(): string {
    return this.workspaceConfig.get('compilationOutput', '');
  }

  public getCompilationFlags(): string {
    const flags: string[] = [];
    const target: string | undefined = this.compilationTarget();
    if (target) flags.push(target);
    const extraArgs = this.compilationExtraArgs();
    if (extraArgs) {
      for (const arg of extraArgs.split(' ')) {
        flags.push(arg);
      }
    }
    const outputFile = this.compilationOutput();
    if (outputFile) {
      flags.push('--output');
      flags.push(outputFile);
    }
    const compilationFlags = flags.join(' ').trim();
    return compilationFlags;
  }

  // Other configuration methods
  public noColors(): boolean {
    return this.workspaceConfig.get('noColors', true);
  }

  public vscodeErrors(): boolean {
    return this.workspaceConfig.get('vscodeErrors', true);
  }

  public showNameIds(): boolean {
    return this.workspaceConfig.get('showNameIds', false);
  }

  public logLevel(): string {
    return this.workspaceConfig.get('logLevel', "error");
  }

  public noTermination(): boolean {
    return this.workspaceConfig.get('noTermination', false);
  }

  public noPositivity(): boolean {
    return this.workspaceConfig.get('noPositivity', false);
  }

  public noStdlib(): boolean {
    return this.workspaceConfig.get('noStdlib', false);
  }

  public useInternalBuildDirOption(): boolean {
    return this.workspaceConfig.get('useInternalBuildDirOption', false);
  }

  public internalBuildDir(): string {
    return this.workspaceConfig.get('internalBuildDir', '');
  }

  public judocDir(): string {
    return this.workspaceConfig.get('judocDir', '');
  }

  public reloadReplOnSave(): boolean {
    return this.workspaceConfig.get('reloadReplOnSave', false);
  }

  public getGlobalFlags(): string {
    const flags: string[] = [];
    if (this.noColors()) flags.push('--no-colors');
    if (this.vscodeErrors()) flags.push('--vscode');
    if (this.showNameIds()) flags.push('--show-name-ids');
    if (this.noTermination()) flags.push('--no-termination');
    if (this.noPositivity()) flags.push('--no-positivity');
    if (this.noStdlib()) flags.push('--no-stdlib');

    flags.push('--log-level=' + this.logLevel());

    if (this.useInternalBuildDirOption()) {
      const buildDir = this.getInternalBuildDir();
      if (buildDir) {
        flags.push('--internal-build-dir');
        flags.push(buildDir);
      }
    }
    return flags.join(' ').trim();
  }

  // Internal and temporary directory methods
  public getInternalBuildDir(): string | undefined {
    const useTmpDir = () => {
      const tmpPath = path.join(tmpdir(), '.juvix-build');
      try {
        const tmp = fs.mkdtempSync(tmpPath);
        const juvixBuildDir = tmp.toString();
        return juvixBuildDir;
      } catch (e) {
        logger.error(
          `Error creating temporary directory ${tmpPath}: ${e}`,
          'config.ts',
        );
        return ''; // Add a return statement here
      }
    };

    const buildDir = this.internalBuildDir();

    if (buildDir) {
      const juvixBuildDir = buildDir.toString();
      try {
        if (fs.existsSync(juvixBuildDir)) {
          return juvixBuildDir;
        } else {
          const tmpJuvixDir = useTmpDir();
          return tmpJuvixDir;
        }
      } catch (e) {
        logger.error(`An error occurred: ${e}`, 'config.ts');
        const tmpJuvixBuildDir = useTmpDir();
        return tmpJuvixBuildDir;
      }
    }
    const tmpJuvixBuildDir = useTmpDir();
    return tmpJuvixBuildDir;
  }

  public getJudocdDir(): string {
    const judocDir = this.judocDir();
    if (judocDir) return judocDir.toString();
    const tmp = path.join(tmpdir(), fs.mkdtempSync('judoc'));
    try {
      fs.mkdirSync(tmp);
      return tmp.toString();
    } catch (e) {
      logger.error(
        'Error creating temporary directory for Judoc: ' + e,
        'config.ts',
      );
    }
    return 'html';
  }

  // Input mode configuration methods
  public enableSemanticSyntax(): boolean {
    return this.workspaceConfig.get('enableSemanticSyntax', true);
  }

  public inputModeEnabled(): boolean {
    return this.workspaceConfig.get('input.enabled', true);
  }
}

export interface TaggedList {
  [abbrev: string]: string;
}

export const config = new JuvixConfig();
