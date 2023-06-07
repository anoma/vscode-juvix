/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import * as check from './check';
import * as codelens from './codelens';
import * as goToDefinition from './definitions';
import * as dev from './dev';
import * as formatter from './formatter';
import * as syntaxHighlighter from './highlighting';
import * as hoverInfo from './hover';
import * as inputMethod from './input';
import * as judoc from './judoc';
import * as repl from './repl';
import * as statusBar from './statusbar';
import * as tasks from './tasks';
import * as vampir from './vampir/tasks';
import * as installer from './installer';
import { checkForUpgrade, checkJuvixBinary } from './juvixVersion';

export async function activate(context: vscode.ExtensionContext) {
  installer.activate(context);
  checkJuvixBinary().then(version => {
    statusBar.activate(context, version);
    checkForUpgrade(version);
    codelens.activate(context);
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
  });
}
