/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import { serializerWithDefault, VsCodeSetting } from './utils/VsCodeSetting';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { logger } from './utils/debug';
import { ConfigurationTarget } from 'vscode';

export class JuvixConfig {
  readonly binaryName = new VsCodeSetting('juvix-mode.juvixBinName', {
    serializer: serializerWithDefault('juvix'),
  });

  readonly binaryPath = new VsCodeSetting('juvix-mode.juvixBinPath', {
    serializer: serializerWithDefault(''),
  });

  readonly globalClean = new VsCodeSetting('juvix-mode.globalClean', {
    serializer: serializerWithDefault(false),
  });

  public getCleanFlags(): string {
    const globalClean = this.globalClean.get();
    if (globalClean) return '--global';
    return '';
  }

  public getJuvixExec(): string {
    const binPath = this.binaryPath.get();
    const binName = this.binaryName.get();
    // logger.debug(`binPath: ${binPath}`);
    // logger.debug(`binName: ${binName}`);
    return path.join(binPath, binName);
  }

  public setJuvixExec(juvixExec: string): void {
    this.binaryPath.set(path.dirname(juvixExec));
    this.binaryName.set(path.basename(juvixExec));
  }

  // extraArgs for typechecking
  readonly typecheckExtraArgs = new VsCodeSetting(
    'juvix-mode.typecheckExtraArgs',
    {
      serializer: serializerWithDefault(''),
      target: ConfigurationTarget.Global,
    },
  );
  // extraArgs for compilation
  readonly compilationExtraArgs = new VsCodeSetting(
    'juvix-mode.compilationExtraArgs',
    {
      serializer: serializerWithDefault(''),
      target: ConfigurationTarget.Global,
    },
  );

  readonly compilationTarget = new VsCodeSetting(
    'juvix-mode.compilationTarget',
    {
      serializer: serializerWithDefault('native'),
      target: ConfigurationTarget.Global,
    },
  );
  readonly compilationOutput = new VsCodeSetting(
    'juvix-mode.compilationOutput',
    {
      serializer: serializerWithDefault(''),
      target: ConfigurationTarget.Global,
    },
  );

  // VampIR settings
  readonly vampirBinaryName = new VsCodeSetting('juvix-mode.vampirBinName', {
    serializer: serializerWithDefault('vamp-ir'),
    target: ConfigurationTarget.Global,
  });
  readonly vampirBinaryPath = new VsCodeSetting('juvix-mode.vampirBinPath', {
    serializer: serializerWithDefault(''),
    target: ConfigurationTarget.Global,
  });

  public getVampirExec(): string {
    return path.join(this.vampirBinaryPath.get(), this.vampirBinaryName.get());
  }

  // Geb settings
  readonly gebBinaryName = new VsCodeSetting('juvix-mode.gebName', {
    serializer: serializerWithDefault('geb.image'),
    target: ConfigurationTarget.Global,
  });
  readonly gebBinaryPath = new VsCodeSetting('juvix-mode.gebBinPath', {
    serializer: serializerWithDefault(''),
    target: ConfigurationTarget.Global,
  });

  public getGebExec(): string {
    return path.join(this.gebBinaryPath.get(), this.gebBinaryName.get());
  }

  readonly revealPanel = new VsCodeSetting('juvix-mode.revealPanel', {
    target: ConfigurationTarget.Global,
  });
  readonly typecheckOn = new VsCodeSetting('juvix-mode.typecheckOn', {
    target: ConfigurationTarget.Global,
  });

  readonly noColors = new VsCodeSetting('juvix-mode.noColors', {
    target: ConfigurationTarget.Global,
  });

  readonly showNameIds = new VsCodeSetting('juvix-mode.showNameIds', {
    target: ConfigurationTarget.Global,
  });
  readonly onlyErrors = new VsCodeSetting('juvix-mode.onlyErrors', {
    target: ConfigurationTarget.Global,
  });
  readonly noTermination = new VsCodeSetting('juvix-mode.noTermination', {
    target: ConfigurationTarget.Global,
  });
  readonly noPositivity = new VsCodeSetting('juvix-mode.noPositivity', {
    target: ConfigurationTarget.Global,
  });
  readonly noStdlib = new VsCodeSetting('juvix-mode.noStdlib', {
    target: ConfigurationTarget.Global,
  });
  readonly internalBuildDir = new VsCodeSetting('juvix-mode.internalBuildDir', {
    target: ConfigurationTarget.Global,
  });
  readonly judocDir = new VsCodeSetting('juvix-mode.judocDir', {
    target: ConfigurationTarget.Global,
  });

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

    const buildDir = this.internalBuildDir.get();

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
    const judocDir = this.judocDir.get();
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

  readonly typecheckOnChange = new VsCodeSetting(
    'juvix-mode.typecheckOnChange',
    {
      serializer: serializerWithDefault(false),
    },
  );

  public getGlobalFlags(): string {
    const flags: string[] = [];
    if (this.noColors.get()) flags.push('--no-colors');
    if (this.showNameIds.get()) flags.push('--show-name-ids');
    if (this.onlyErrors.get()) flags.push('--only-errors');
    if (this.noTermination.get()) flags.push('--no-termination');
    if (this.noPositivity.get()) flags.push('--no-positivity');
    if (this.noStdlib.get()) flags.push('--no-stdlib');

    const buildDir = this.getInternalBuildDir();
    if (buildDir) {
      flags.push('--internal-build-dir');
      flags.push(buildDir);
    }
    return flags.join(' ').trim();
  }

  readonly vampirTarget: VsCodeSetting<string> = new VsCodeSetting(
    'juvix-mode.vampirTarget',
  );
  readonly reloadReplOnSave = new VsCodeSetting('juvix-mode.reloadReplOnSave', {
    serializer: serializerWithDefault(false),
  });

  public getTypeckeckFlags(): string {
    const flags: string[] = []; // Explicitly define the type of the flags array
    const extraArgs = this.typecheckExtraArgs.get();
    if (extraArgs) {
      for (const arg of extraArgs.split(' ')) {
        flags.push(arg);
      }
    }
    const typecheckFlags = flags.join(' ').trim();
    return typecheckFlags;
  }

  public getCompilationFlags(): string {
    const flags: string[] = [];
    const target: string | undefined = this.compilationTarget.get();
    if (target) flags.push(target);
    const extraArgs = this.compilationExtraArgs.get();
    if (extraArgs) {
      for (const arg of extraArgs.split(' ')) {
        flags.push(arg);
      }
    }
    const outputFile = this.compilationOutput.get();
    if (outputFile) {
      flags.push('--output');
      flags.push(outputFile);
    }
    const compilationFlags = flags.join(' ').trim();
    return compilationFlags;
  }

  readonly enableSemanticSyntax = new VsCodeSetting(
    'juvix-mode.enableSemanticSyntax',
    {
      serializer: serializerWithDefault(true),
    },
  );
  readonly inputModeEnabled = new VsCodeSetting('juvix-mode.input.enabled', {
    serializer: serializerWithDefault(true),
  });

  readonly abbreviationCharacter = new VsCodeSetting(
    'juvix-mode.input.leader',
    {
      serializer: serializerWithDefault('\\'),
    },
  );

  readonly languages = new VsCodeSetting('juvix-mode.input.languages', {
    serializer: serializerWithDefault(['Juvix']),
  });

  readonly inputModeCustomTranslations = new VsCodeSetting(
    'juvix-mode.input.customTranslations',
    {
      serializer: serializerWithDefault<TaggedList>({}),
    },
  );

  readonly eagerReplacementEnabled = new VsCodeSetting(
    'juvix-mode.input.eagerReplacementEnabled',
    {
      serializer: serializerWithDefault(true),
    },
  );
}

export interface TaggedList {
  [abbrev: string]: string;
}

// eslint-disable-next-line prefer-const
export let config = new JuvixConfig();
