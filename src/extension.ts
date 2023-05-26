/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import * as tasks from './tasks';
import * as statusBar from './statusbar';
import * as syntaxHighlighter from './highlighting';
import * as goToDefinition from './definitions';
import * as hoverInfo from './hover';
import * as inputMethod from './input';
import * as repl from './repl';
import * as judoc from './judoc';
import * as dev from './dev';
import * as check from './check';
import * as formatter from './formatter';
import * as vampir from './vampir/tasks';
import * as codelens from './codelens';
import * as root from './root';

export async function activate(context: vscode.ExtensionContext) {
  debugChannel.clear();
  statusBar.activate(context);
  root.activate(context);
  syntaxHighlighter.activate(context);
  goToDefinition.activate(context);
  hoverInfo.activate(context);
  tasks.activate(context);
  inputMethod.activate(context);
  repl.activate(context);
  judoc.activate(context);
  check.activate(context);
  formatter.activate(context);
  vampir.activate(context);
  dev.activate(context);
  codelens.activate(context);
  debugChannel.info('Juvix extension is ready!');

}
