/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import * as statusbar from './statusbar';
import { getModuleName } from './module';
import {
  isJuvixFile,
  isJuvixMarkdownFile,
  isPureJuvixFile,
} from './utils/base';

/**
 * CodelensProvider
 */


export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'Juvix' },
      new JuvixCodelensProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'JuvixMarkdown' },
      new JuvixCodelensProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.enableCodeLens', () => {
      vscode.workspace
        .getConfiguration('juvix-mode')
        .update('enableCodeLens', true, true);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.disableCodeLens', () => {
      vscode.workspace
        .getConfiguration('juvix-mode')
        .update('enableCodeLens', false, true);
    }),
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
      },
    ),
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
    _token: vscode.CancellationToken,
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

      if(document.fileName.endsWith('Package.juvix') && text.length === 0){
const packageText: string = `module Package;

import PackageDescription.V2 open;

package : Package :=
  defaultPackage
    { name := "MyPackage"
    ; version := mkVersion 0 1 0
    ; dependencies := []
    };
`;
        const packageCodeLenses = new vscode.CodeLens(firstLineRange, {
          title: 'Insert Package module template',
          command: 'juvix-mode.aux.prependText',
          arguments: [
            {
              text: packageText,
            },
          ],
        });
        this.codeLenses = [packageCodeLenses, ...this.codeLenses];
        return this.codeLenses;
      }

      const moduleName: string | undefined = getModuleName(document);
      const moduleDeclaration = `module ${moduleName};`;

      let insertPosition: vscode.Position = new vscode.Position(0, 0);
      let juvixBlockText: string = '';

      if (moduleName && text.length === 0) {

        if (isPureJuvixFile(document)) {
          juvixBlockText = `${moduleDeclaration}\n\n`;
        } else if (isJuvixMarkdownFile(document)) {
          juvixBlockText = `\`\`\`juvix\n${moduleDeclaration}\n\`\`\`\n\n`;
        }

        const insertModuleCodeLenses = new vscode.CodeLens(
          new vscode.Range(insertPosition, insertPosition),
          {
            title: `Insert "${moduleDeclaration}"`,
            command: 'juvix-mode.aux.prependText',
            arguments: [
              {
                text: juvixBlockText,
              },
            ],
          },
        );

        this.codeLenses = [insertModuleCodeLenses, ...this.codeLenses];
      }

      return this.codeLenses;
    }
    return [];
  }
}
