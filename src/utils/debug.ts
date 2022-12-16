/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

export const juvixChannel = vscode.window.createOutputChannel(
  'Juvix Extension',
  'json'
);

export function log(cat: string, ...o: any): void {
  switch (cat.toLowerCase()) {
    case 'clear':
      juvixChannel.clear();
      return;
    case 'info':
      o.map((args: any) => {
        juvixChannel.appendLine('' + mapObject(args));
      });
      juvixChannel.show(true);
      return;

    case 'warn':
      juvixChannel.appendLine('[WARN]:');
      o.map((args: any) => {
        juvixChannel.appendLine('' + mapObject(args));
      });
      juvixChannel.show(true);
      return;

    case 'error':
      let err = '';
      juvixChannel.appendLine('[ERROR]: ');
      //err += mapObject(cat) + ": \r\n";
      o.map((args: any) => {
        err += mapObject(args);
      });
      juvixChannel.appendLine(err);
      vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
      juvixChannel.show(true);
      return;

    default:
      juvixChannel.appendLine('[INFO]:');
      juvixChannel.appendLine(mapObject(cat));
      o.map((args: any) => {
        juvixChannel.appendLine('' + mapObject(args));
      });
      juvixChannel.show(true);
      return;
  }
}

function mapObject(obj: any) {
  switch (typeof obj) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return obj;
    case 'number':
      return obj.toString;
    case 'object':
      let ret = '';
      for (const [key, value] of Object.entries(obj)) {
        ret += `${key}: ${value}\n`;
      }
      return ret;

    default:
      return obj;
  }
}
