/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { JuvixConfig } from './config';

export let juvixRoot: string;

export function activate(_context: vscode.ExtensionContext) {
    const config = new JuvixConfig();
    const { spawnSync } = require('child_process');
    const doc = vscode.window.activeTextEditor?.document;
    juvixRoot = '';
    if (doc) {
        const juvixRootCall = [
            config.getJuvixExec(),
            config.getGlobalFlags(),
            'dev',
            'root',
            doc.uri.fsPath,
        ].join(' ');

        const rootRun = spawnSync(juvixRootCall, { shell: true, encoding: 'utf8' });
        if (rootRun.status !== 0) {
            const errMsg: string = "Juvix's Error: " + rootRun.stderr.toString();
            debugChannel.error('Juvix root failed for Judoc gen:', errMsg);
            throw new Error(errMsg);
        }
        juvixRoot = rootRun.stdout.toString().trim();
    }
}