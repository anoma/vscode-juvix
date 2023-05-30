/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { juvixRoot, globalJuvixRoot, isUsingGlobalRoot } from './root';
import * as path from 'path';
import { isJuvixFile } from './utils/base';


export function getModuleName(document: vscode.TextDocument): string | undefined {

    const projRoot = juvixRoot();
    const parsedFilepath = path.parse(document.fileName);
    if (!isJuvixFile(document)) {
        return undefined;
    }
    let moduleName: string | undefined = undefined;
    if (isUsingGlobalRoot(document)) {
        moduleName = parsedFilepath.name;
    } else {
        let relativeModulePath: string =
            path.relative(projRoot, parsedFilepath.dir).replace(path.sep, ".");
        moduleName =
            `${relativeModulePath}${relativeModulePath.length > 0 ? '.' : ''}${parsedFilepath.name}`;
    }
    return moduleName;


}
