/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { debugChannel } from './utils/debug';
import { JuvixConfig } from './config';
import { getInstalledNumericVersion } from './juvixVersion';
import * as path from 'path';

export function juvixRoot() {
    const config = new JuvixConfig();
    const { spawnSync } = require('child_process');
    const doc = vscode.window.activeTextEditor?.document;
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
        return rootRun.stdout.toString().trim();
    }
    return undefined;
}


export function globalJuvixRoot() : string {
    const juvixVersion = getInstalledNumericVersion();
    const homeUserPath = process.env.HOME;
    if (!homeUserPath) {
        throw new Error('Cannot find home directory');
    }
    if (!juvixVersion) {
        throw new Error('Cannot find Juvix version');
    }
    return path.join(homeUserPath, '.config', 'juvix', juvixVersion, 'global-project');
}
