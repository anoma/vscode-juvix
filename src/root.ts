/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { logger } from './utils/debug';
import { config } from './config';
import { getInstalledNumericVersion } from './juvixVersion';
import * as path from 'path';
import { isJuvixFile } from './utils/base';

export function juvixRoot(
  document: vscode.TextDocument | undefined = undefined
): string | undefined {
  const { spawnSync } = require('child_process');
  const doc: vscode.TextDocument | undefined =
    document ?? vscode.window.activeTextEditor?.document;
  if (!doc || !isJuvixFile(doc)) {
    return undefined;
  }
  const juvixRootCall = `${config.getJuvixExec()} dev root ${doc.uri.fsPath}`;
  const { status, stderr, stdout } = spawnSync(juvixRootCall, {
    shell: true,
    encoding: 'utf8',
  });
  if (status !== 0) {
    logger.trace(stderr.toString());
    return undefined;
  }
  const root: string = stdout.toString().trim();
  return root;
}

export function globalJuvixRoot(): string {
  const juvixVersion = getInstalledNumericVersion();
  const { HOME } = process.env;
  const rootPath = path.join(
    HOME ?? '',
    '.config',
    'juvix',
    juvixVersion ?? '',
    'global-project',
    path.sep
  );
  return rootPath;
}

export function isUsingGlobalRoot(doc: vscode.TextDocument): boolean {
  if (!isJuvixFile(doc)) return false;
  return juvixRoot() === globalJuvixRoot();
}
