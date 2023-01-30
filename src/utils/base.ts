/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';

export function needsJuvix(document: vscode.TextDocument): boolean {
  return (
    isJuvixFile(document) ||
    isJuvixCoreFile(document) ||
    isJuvixAsmFile(document)
  );
}

export function isJuvixFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'Juvix';
}

export function isJuvixCoreFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixCore';
}

export function canRunRepl(document: vscode.TextDocument): boolean {
  return isJuvixFile(document) || isJuvixCoreFile(document);
}

export function isJuvixAsmFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixAsm';
}
