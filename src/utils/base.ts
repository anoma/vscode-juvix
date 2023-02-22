/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';

export function needsJuvix(document: vscode.TextDocument): boolean {
  return (
    isJuvixFile(document) ||
    isJuvixCoreFile(document) ||
    isJuvixAsmFile(document) ||
    isJuvixGebFile(document)
  );
}

export function isJuvixFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'Juvix';
}

export function isJuvixCoreFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixCore';
}

export function isJuvixGebFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixGeb';
}

export function isVampIRFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'VampIR';
}

export function canRunRepl(document: vscode.TextDocument): boolean {
  return (
    isJuvixFile(document) ||
    isJuvixCoreFile(document) ||
    isJuvixGebFile(document)
  );
}

export function isJuvixAsmFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixAsm';
}
