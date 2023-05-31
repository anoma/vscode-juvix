/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import { juvixRoot, isUsingGlobalRoot } from './root';
import * as path from 'path';
import { isJuvixFile } from './utils/base';
import { logger as logger } from './utils/debug';

export function getModuleName(document: vscode.TextDocument): string | undefined {
    if (!isJuvixFile(document)) return undefined;
    const projRoot = juvixRoot();
    logger.trace(`Document: ${document.fileName}`, "module.ts");
    logger.trace(`Project root: ${projRoot}`, "module.ts");
    if (!projRoot) {
        logger.error("Juvix's Error: Cannot find Juvix root", "module.ts");
        return undefined;
    }
    logger.trace(`Using Juvix root: ${projRoot}`, "module.ts");
    const parsedFilepath = path.parse(document.fileName);
    const moduleName = isUsingGlobalRoot(document)
        ? parsedFilepath.name
        : `${path.relative(projRoot, parsedFilepath.dir).split(path.sep).join('.')}.${parsedFilepath.name}`;
    logger.trace(`Module name: ${moduleName}`, "module.ts");
    return moduleName;
}
