/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { juvixRoot, isUsingGlobalRoot } from './root';
import * as path from 'path';
import { isJuvixFile } from './utils/base';

export function getModuleName(
  document: vscode.TextDocument
): string | undefined {
  if (!isJuvixFile(document)) return undefined;
  const projRoot = juvixRoot();
  if (!projRoot) return undefined;
  const parsedFilepath = path.parse(document.fileName);
  const moduleName = isUsingGlobalRoot(document)
    ? parsedFilepath.name
    : (relativePath => {
        const result = `${relativePath}.${parsedFilepath.name}`;
        return result.startsWith('.') ? result.slice(1) : result;
      })(path.relative(projRoot, parsedFilepath.dir).split(path.sep).join('.'));
  return moduleName;
}
