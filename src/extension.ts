/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import * as tasks from './tasks';
import * as user from './config';
import * as statusBar from './statusbar';
import * as syntaxHighlighter from './highlighting';
import * as goToDefinition from './definitions';
import * as inputMethod from './input';
import * as repl from './repl';
import * as dev from './dev';

export async function activate(context: vscode.ExtensionContext) {
  debugChannel.clear();
  repl.activate(context);
  statusBar.activate(context);
  inputMethod.activate(context);
  tasks.activate(context);
  syntaxHighlighter.activate(context);
  goToDefinition.activate(context);
  dev.activate(context);
  debugChannel.info('Juvix extension is ready!');
}
