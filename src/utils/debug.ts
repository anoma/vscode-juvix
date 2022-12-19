/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';

export const debugChannel: vscode.LogOutputChannel =
  vscode.window.createOutputChannel('Juvix Extension Debug', { log: true });
