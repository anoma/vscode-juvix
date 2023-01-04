
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
   context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === 'Juvix' || doc.languageId === 'JuvixCore')
            vscode.commands.executeCommand('editor.action.indentationToSpaces');
        }
    ));    
}
		