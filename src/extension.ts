import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Juvix Extension is now active!');
    
// begin example of a modal:
    const msg = vscode.commands.registerCommand(
        'juvix.typecheck', () => {
        vscode.window.showInformationMessage('No type checking errors', { modal: false });
        // vscode.ShellExecution()
    });
    context.subscriptions.push(msg);
// end of the example
    // const activatePS = require('./Main').main;
}

export function deactivate() {}