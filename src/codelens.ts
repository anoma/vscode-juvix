import * as vscode from 'vscode';
import * as statusbar from './statusbar';
import { getModuleName } from './module';
import { isJuvixFile } from './utils/base';

/**
 * CodelensProvider
 */

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'Juvix' },
            new CodelensProvider()
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("juvix-mode.enableCodeLens", () => {
            vscode.workspace.getConfiguration("juvix-mode").update("enableCodeLens", true, true);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("juvix-mode.disableCodeLens", () => {
            vscode.workspace.getConfiguration("juvix-mode").update("enableCodeLens", false, true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("juvix-mode.aux.prependText", (args: any) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const position = new vscode.Position(0, 0);
                editor.edit((editBuilder) => {
                    editBuilder.insert(position, args.text);
                });
            }
        })
    );
}

export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(
        document: vscode.TextDocument
        , _token: vscode.CancellationToken)
        : vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        if (!isJuvixFile(document)) {
        return [];
        }

        if (vscode.workspace.getConfiguration("juvix-mode").get("codeLens", true)) {
            this.codeLenses = [];

            const text = document.getText();
            let firstLineRange = document.lineAt(0).range;
            /*
            Add a code lenses to show the Juvix version
            in the first line of the document.
            */
            let juvixVersionCodeLenses = new vscode.CodeLens(firstLineRange, {
                title: "Powered by " + statusbar.juvixStatusBarItemVersion.text,
                command: ""
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

            let regex = /module\s+([\w.]+);/;
            let match = text.match(regex);
            let moduleName: string | undefined = getModuleName(document);
            if (moduleName && (text.length === 0 || match === null)) {
                let moduleTopHeader: string = `module ${moduleName};`;
                let insertModuleCodeLenses = new vscode.CodeLens(
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    {
                        title: `Insert "${moduleTopHeader}"`,
                        command: "juvix-mode.aux.prependText",
                        arguments: [
                            {
                                text: `${moduleTopHeader}\n\n`
                            }
                        ]
                    }
                );

                this.codeLenses = [insertModuleCodeLenses].concat(this.codeLenses);
            }

            return this.codeLenses;
        }
        return [];
    }
}
