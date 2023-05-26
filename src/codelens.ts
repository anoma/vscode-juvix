import * as vscode from 'vscode';
import * as statusbar from './statusbar';
import { juvixRoot } from './root';
import { isJuvixFile } from './utils/base';
/**
 * CodelensProvider
 */

export function activate(context: vscode.ExtensionContext) {
    statusbar.activate(context);
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
        vscode.commands.registerCommand("juvix-mode.codelensAction", (args: any) => {
            vscode.window.showInformationMessage(`CodeLens action clicked with args=${args}`);
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

        if (vscode.workspace
            .getConfiguration("JuvixCodeLens")
            .get("enableCodeLens", true)) {

            this.codeLenses = [];
            const text = document.getText();

            /*
                Add a code lenses that checks if the document is empty.
                If it is, it suggests to insert the module header
                relative to juvixRoot.
                The content inserted by the code lenses should be:
                   "module <module name>;"
                where <module name> document filepath relative to juvixRoot
                and the slashes are replaced by dots.
            */
            let firstLineRange = document.lineAt(0).range;
            // check if the file doesnn't define a module. This check is not perfe
            const regex = /module\s+([\w.]+);/;
            const match = text.match(regex);
            const noModule = text.length === 0 || match === null;
            if (noModule &&
                !document.isUntitled &&
                isJuvixFile(document) &&
                juvixRoot !== undefined) {
                let moduleName = document.fileName;
                moduleName = moduleName
                    .replace(juvixRoot, "")
                    .replace(".juvix", "")
                    .replace(/\\/g, ".")
                    .replace(/\//g, ".");
                // insert the snippet in the first line of the document

                let insertModuleCodeLenses = new vscode.CodeLens(
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))
                    , {
                        title: "Insert \"module " + moduleName + ";\"",
                        command: ""
                    });

                this.codeLenses.push(insertModuleCodeLenses);
            }

            /*
                Add a code lenses to show the Juvix version
                in the first line of the document.
            */
            let juvixVersionCodeLenses = new vscode.CodeLens(firstLineRange, {
                title: "Powered by " + statusbar.juvixStatusBarItemVersion.text,
                command: ""
            });
            this.codeLenses.push(juvixVersionCodeLenses);

            return this.codeLenses;
        }
        return [];
    }

}
