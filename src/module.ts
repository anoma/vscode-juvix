/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { juvixRoot, isUsingGlobalRoot } from './root';
import * as path from 'path';
import { isJuvixFile } from './utils/base';

export function getModuleName(
  document: vscode.TextDocument,
): string | undefined {
  if (!isJuvixFile(document)) return undefined;
  const projRoot = juvixRoot();
  if (!projRoot) return undefined;

  const parsedFilepath = path.parse(document.fileName);

  // Handle .juvix.md extension
  let baseName = parsedFilepath.name;
  if (baseName.endsWith('.juvix')) {
    baseName = baseName.slice(0, -'.juvix'.length);
  }

  const moduleName = isUsingGlobalRoot(document)
    ? baseName
    : (relativePath => {
        const result = `${relativePath}.${baseName}`;
        return result.startsWith('.') ? result.slice(1) : result;
      })(path.relative(projRoot, parsedFilepath.dir).split(path.sep).join('.'));

  return moduleName;
}
