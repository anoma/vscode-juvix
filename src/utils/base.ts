import { spawn, spawnSync } from 'child_process';
import * as vscode from 'vscode';
import { Mutex } from 'async-mutex';

export function needsJuvix(document: vscode.TextDocument): boolean {
  return (
    isJuvixFile(document) ||
    isJuvixCoreFile(document) ||
    isJuvixAsmFile(document)
  );
}

export function isJuvixMarkdownFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'JuvixMarkdown';
}

export function isPureJuvixFile(document: vscode.TextDocument): boolean {
  return document.languageId == 'Juvix';
}

export function isJuvixFile(document: vscode.TextDocument): boolean {
  return isPureJuvixFile(document) || isJuvixMarkdownFile(document);
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

export function runShellCommandSync(command: string, input?: string): { stdout: string, stderr: string, status: number | null } {
  return spawnSync(command, { shell: true, input, encoding: 'utf8' });
}

const shellLock = new Mutex();

export async function runShellCommand(command: string, input?: string): Promise<{ stdout: string, stderr: string, status: number | null }> {
  const release = await shellLock.acquire();
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(command, { shell: true });

      let stdout = '';
      let stderr = '';

      if (input !== undefined) {
        child.stdin.setDefaultEncoding('utf8');
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (status) => {
        release();
        resolve({ stdout, stderr, status });
      });

      child.on('error', (err) => {
        release();
        reject(err);
      });
    } catch (err) {
      release();
      reject(err);
    }
  });
}
