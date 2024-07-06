/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import * as statusbar from './statusbar';
import { getModuleName } from './module';
import { isJuvixFile, isJuvixMarkdownFile, isPureJuvixFile } from './utils/base';

/**
 * CodelensProvider
 */

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'Juvix' },
      new JuvixCodelensProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'JuvixMarkdown' },
      new JuvixCodelensProvider()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.enableCodeLens', () => {
      vscode.workspace
        .getConfiguration('juvix-mode')
        .update('enableCodeLens', true, true);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.disableCodeLens', () => {
      vscode.workspace
        .getConfiguration('juvix-mode')
        .update('enableCodeLens', false, true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'juvix-mode.aux.prependText',
      (args: any) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const position = new vscode.Position(0, 0);
          editor.edit(editBuilder => {
            editBuilder.insert(position, args.text);
          });
        }
      }
    )
  );
}

export class JuvixCodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    vscode.workspace.onDidChangeConfiguration(_ => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (!isJuvixFile(document)) {
      return [];
    }

    if (vscode.workspace.getConfiguration('juvix-mode').get('codeLens', true)) {
      this.codeLenses = [];


      const text = document.getText();
      const firstLineRange = document.lineAt(0).range;
      /*
            Add a code lenses to show the Juvix version
            in the first line of the document.
            */
      const juvixVersionCodeLenses = new vscode.CodeLens(firstLineRange, {
        title: 'Powered by ' + statusbar.juvixStatusBarItemVersion.text,
        command: '',
      });
      this.codeLenses.push(juvixVersionCodeLenses);

      /*
            Add a code lenses that checks if the document is empty.
            If it is, it suggests to insert the module header
            relative to juvixRoot.
            The content inserted by the code lenses should be:
            "module <module name>;"
            where <module name> document filepath relative to juvixRoot
            and the slashes are replaced by dots.
            */

      const regex = /module\s+([\w.]+);/;
      const match = text.match(regex);
      const moduleName: string | undefined = getModuleName(document);
      let insertPosition: vscode.Position = new vscode.Position(0, 0);
      let juvixBlockText: string = '';

      if (moduleName && (text.length === 0 || match === null)) {
        const moduleTopHeader = `module ${moduleName};`;

        if (isPureJuvixFile(document)) {
          insertPosition = new vscode.Position(0, 0);
          juvixBlockText = `${moduleTopHeader}\n\n`;
        } else if (isJuvixMarkdownFile(document)) {
          const metadataMatch = text.match(/---\n([\s\S]*?)\n---/);
          if (metadataMatch) {
            insertPosition = new vscode.Position(metadataMatch[0].split('\n').length, 0);
          } else {
            insertPosition = new vscode.Position(0, 0);
          }
          juvixBlockText = `\`\`\`juvix\n${moduleTopHeader}\n\`\`\`\n\n`;
        }

        const insertModuleCodeLenses = new vscode.CodeLens(
          new vscode.Range(insertPosition, insertPosition),
          {
            title: `Insert "${moduleTopHeader}"`,
            command: 'juvix-mode.aux.prependText',
            arguments: [
              {
                text: juvixBlockText,
              },
            ],
          }
        );

        this.codeLenses = [insertModuleCodeLenses, ...this.codeLenses];
      }


      return this.codeLenses;
    }
    return [];
  }
}
