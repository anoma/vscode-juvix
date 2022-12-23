/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import { debugChannel } from './utils/debug';
import * as vscode from 'vscode';
import { serializerWithDefault, VsCodeSetting } from './utils/VsCodeSetting';
import * as path from 'path';

export class JuvixConfig {
  readonly binaryName = new VsCodeSetting('juvix-mode.bin.name', {
    serializer: serializerWithDefault('Juvix'),
  });

  readonly binaryPath = new VsCodeSetting('juvix-mode.bin.path', {
    serializer: serializerWithDefault(''),
  });

  public getJuvixExec(): string {
    return path.join(this.binaryPath.get(), this.binaryName.get());
  }

  readonly statusBarIcons = new VsCodeSetting('juvix-mode.statusBarIcons');
  readonly revealPanel = new VsCodeSetting('juvix-mode.revealPanel');
  readonly noColors = new VsCodeSetting('juvix-mode.opts.noColors');

  readonly showNameIds = new VsCodeSetting('juvix-mode.opts.showNameIds');
  readonly onlyErrors = new VsCodeSetting('juvix-mode.opts.onlyErrors');
  readonly noTermination = new VsCodeSetting('juvix-mode.opts.noTermination');
  readonly noPositivity = new VsCodeSetting('juvix-mode.opts.noPositivity');
  readonly noStdlib = new VsCodeSetting('juvix-mode.opts.noStdlib');

  // Dev
  readonly enableDevTasks = new VsCodeSetting('juvix-mode.enableDevTasks', {
    serializer: serializerWithDefault(false),
  });
  readonly devTasks = new VsCodeSetting('juvix-mode.devTasks', {
    serializer: serializerWithDefault<TaggedList>({}),
  });

  public getGlobalFlags(): string {
    const flags = [];
    if (this.noColors.get()) flags.push('--no-colors');
    if (this.showNameIds.get()) flags.push('--show-name-ids');
    if (this.onlyErrors.get()) flags.push('--only-errors');
    if (this.noTermination.get()) flags.push('--no-termination');
    if (this.noPositivity.get()) flags.push('--no-positivity');
    if (this.noStdlib.get()) flags.push('--no-stdlib');
    return flags.join(' ').trim();
  }

  readonly compilationTarget = new VsCodeSetting(
    'juvix-mode.compilationTarget'
  );
  readonly compilationRuntime = new VsCodeSetting(
    'juvix-mode.compilationRuntime'
  );
  readonly compilationOutput = new VsCodeSetting(
    'juvix-mode.compilationOutput'
  );

  readonly reloadReplOnSave = new VsCodeSetting('juvix-mode.reloadReplOnSave', {
    serializer: serializerWithDefault(false),
  });

  public getCompilationFlags(): string {
    const target = this.compilationTarget.get();
    const runtime = this.compilationRuntime.get();
    const flags = [];
    if (target) {
      flags.push('--target');
      flags.push(target);
    }
    if (runtime) {
      flags.push('--runtime');
      flags.push(runtime);
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
    }
  );
  readonly inputModeEnabled = new VsCodeSetting('juvix-mode.input.enabled', {
    serializer: serializerWithDefault(true),
  });

  readonly abbreviationCharacter = new VsCodeSetting(
    'juvix-mode.input.leader',
    {
      serializer: serializerWithDefault('\\'),
    }
  );

  readonly languages = new VsCodeSetting('juvix-mode.input.languages', {
    serializer: serializerWithDefault(['Juvix']),
  });

  readonly inputModeCustomTranslations = new VsCodeSetting(
    'juvix-mode.input.customTranslations',
    {
      serializer: serializerWithDefault<TaggedList>({}),
    }
  );

  readonly eagerReplacementEnabled = new VsCodeSetting(
    'juvix-mode.input.eagerReplacementEnabled',
    {
      serializer: serializerWithDefault(true),
    }
  );
}

export interface TaggedList {
  [abbrev: string]: string;
}
