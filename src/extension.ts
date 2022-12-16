/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import * as debug from './utils/debug';
import * as tasks from './tasks';
import * as user from './config';
import * as statusBar from './statusbar';
import * as syntaxHighlighter from './highlighting';
import * as goToDefinition from './definitions';
import * as inputMethod from './input';

export async function activate(context: vscode.ExtensionContext) {
  const config = new user.JuvixConfig();
  // debug.log('info', config.toString());
  statusBar.activate(context);
  inputMethod.activate(context);
  tasks.activate(context);
  syntaxHighlighter.activate(context);
  goToDefinition.activate(context);
  debug.log('info', 'Juvix extension is ready!');
  debug.juvixChannel.hide();
}
