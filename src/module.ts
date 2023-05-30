/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { juvixRoot, globalJuvixRoot } from './root';
import * as path from 'path';
import { isJuvixFile } from './utils/base';


export function getModuleName(document: vscode.TextDocument): string | undefined {

    const projRoot = juvixRoot();
    const globalProjRoot = globalJuvixRoot();
    const parsedFilepath = path.parse(document.fileName);
    if (!isJuvixFile(document)) {
        return undefined;
    }
    let moduleName: string | undefined = undefined;
    if (projRoot == globalProjRoot) {
        moduleName = parsedFilepath.name;
    } else {
        let relativeModulePath: string =
            path.relative(projRoot, parsedFilepath.dir).replace(path.sep, ".");
        moduleName =
            (projRoot === globalProjRoot) ?
                parsedFilepath.name :
                `${relativeModulePath}${relativeModulePath.length > 0 ? '.' : ''}${parsedFilepath.name}`;
    }
    return moduleName;


}
