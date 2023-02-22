/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { debugChannel } from './../utils/debug';
import { isVampIRFile } from './../utils/base';
import { JuvixConfig } from './../config';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
    debugChannel.clear();
    debugChannel.info('Loading VampIR support!');
    const config = new JuvixConfig();


    context.subscriptions.push(
        vscode.commands.registerCommand('juvix-mode.vampir-setup', () => {
            debugChannel.info('VampIR command invoked!');

            const setupCall = [
                config.getVampirExec(),
                'setup',
                '--unchecked',
                '-o',
                'params.pp'
            ].join(' ');

            debugChannel.appendLine(setupCall);

            const { spawnSync } = require('child_process');
            const ls = spawnSync(setupCall, {
                shell: true,
                encoding: 'utf8',
            });

            debugChannel.appendLine(ls.stdout);

            if (ls.status == 0) {
                const stdout = ls.stdout;
                debugChannel.appendLine(stdout);
            } else {
                const errMsg: string = ls.stderr.toString();
                throw new Error(errMsg);
            }
        }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('juvix-mode.vampir-compile', () => {
            debugChannel.info('VampIR command invoked!');

            const aEditor = vscode.window.activeTextEditor;
            let vampirFile = undefined;
            if (aEditor && aEditor.document){
                const currentDocument = aEditor.document;
                if (isVampIRFile(currentDocument))
                    vampirFile = currentDocument.uri;
            }
            // vamp-ir compile -u params.pp -s tests/range.pir -o circuit.plonk
            const compileCall = [
                config.getVampirExec(),
                'compile',
                '-u',
                'params.pp',
                vampirFile,
                '-o',
                'circuit.plonk'
            ].join(' ');

            debugChannel.appendLine(compileCall);

            const { spawnSync } = require('child_process');
            const ls = spawnSync(compileCall, {
                shell: true,
                encoding: 'utf8',
            });

            debugChannel.appendLine(ls.stdout);

            if (ls.status == 0) {
                const stdout = ls.stdout;
                debugChannel.appendLine(stdout);
            } else {
                const errMsg: string = ls.stderr.toString();
                throw new Error(errMsg);
            }
        }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('juvix-mode.vampir-prove', () => {
            debugChannel.info('VampIR command invoked!');

            const proveCall = [
                config.getVampirExec(),
                'prove',
                '-u',
                'params.pp',
                '-c',
                'circuit.plonk',
                '-o',
                'proof.plonk',
                '-i',
                'input.json'
            ].join(' ');

            debugChannel.appendLine(proveCall);

            const { spawnSync } = require('child_process');
            const ls = spawnSync(proveCall, {
                shell: true,
                encoding: 'utf8',
            });

            debugChannel.appendLine(ls.stdout);

            if (ls.status == 0) {
                const stdout = ls.stdout;
                debugChannel.appendLine(stdout);
            } else {
                const errMsg: string = ls.stderr.toString();
                throw new Error(errMsg);
            }
        }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('juvix-mode.vampir-verify', () => {
            debugChannel.info('VampIR command invoked!');
            // vamp-ir verify -u params.pp -c circuit.plonk -p proof.plonk

            const verifyCall = [
                config.getVampirExec(),
                'verify',
                '-u',
                'params.pp',
                '-c',
                'circuit.plonk',
                '-p',
                'proof.plonk'
            ].join(' ');

            debugChannel.appendLine(verifyCall);

            const { spawnSync } = require('child_process');
            const ls = spawnSync(verifyCall, {
                shell: true,
                encoding: 'utf8',
            });

            debugChannel.appendLine(ls.stdout);

            if (ls.status == 0) {
                const stdout = ls.stdout;
                debugChannel.appendLine(stdout);
            } else {
                const errMsg: string = ls.stderr.toString();
                throw new Error(errMsg);
            }
        }
        )
    );
}