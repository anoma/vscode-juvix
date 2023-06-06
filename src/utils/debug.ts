/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';

class Log {
  public outputChannel: vscode.LogOutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Juvix Extension', {
      log: true,
    });
  }

  private logString(message: string, component?: string) {
    return component ? `${component}> ${message}` : message;
  }

  public trace(message: string, component?: string) {
    this.outputChannel.trace(this.logString(message, component));
  }

  public debug(message: string, component?: string) {
    this.outputChannel.debug(this.logString(message, component));
  }

  public appendLine(message: string, component?: string) {
    this.outputChannel.info(this.logString(message, component));
  }

  public warn(message: string, component?: string) {
    const msg = this.logString(message, component);
    this.outputChannel.error(msg);
    vscode.window.showWarningMessage(msg);
  }

  public error(message: string, component?: string, modal: boolean = false) {
    const msg = this.logString(message, component);
    this.outputChannel.error(msg);
    vscode.window.showErrorMessage(msg, { modal: modal });
    throw new Error(msg);
  }
}

export const logger = new Log();
