/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import { serializerWithDefault, VsCodeSetting } from '../utils/VsCodeSetting';

/*
 * Adapted from vscode-lean sources.
 * See https://github.com/leanprover/vscode-lean
 */

/**
 * Exposes (observable) settings for the abbreviation feature.
 */
export class AbbreviationConfig {
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
      serializer: serializerWithDefault<SymbolsByAbbreviation>({}),
    }
  );

  readonly eagerReplacementEnabled = new VsCodeSetting(
    'juvix-mode.input.eagerReplacementEnabled',
    {
      serializer: serializerWithDefault(true),
    }
  );
}

export interface SymbolsByAbbreviation {
  [abbrev: string]: string;
}
