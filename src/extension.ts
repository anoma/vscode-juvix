import * as vscode from 'vscode';

let juvixStatusBarItem : vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {

    // let's put the version in the status bar
    juvixStatusBarItem = vscode.window.createStatusBarItem
        (vscode.StatusBarAlignment.Left);
    context.subscriptions.push(juvixStatusBarItem);

    const { spawnSync } = require('child_process');
    const ls = spawnSync('juvix', ['--version']);
    let execJuvixVersion : string;
    if (ls.status !== 0) {
        vscode.window.showInformationMessage('Juvix binary not found')
        execJuvixVersion = ls.stderr.toString();
        juvixStatusBarItem.text = 'Juvix not found';
    } else {
    execJuvixVersion = ls.stdout.toString();
    const juvixBinaryVersion : string = execJuvixVersion.split('\n')[0];
    juvixStatusBarItem.text = '🛠️ ' + juvixBinaryVersion;
    }
    context.subscriptions.push(vscode.commands.registerCommand(
        'juvix.getBinaryVersion', () => {
            vscode.window.showInformationMessage(execJuvixVersion
                , {modal : true});
            }
    ));
    juvixStatusBarItem.show();

    
    // Show a message telling if the user has already installed 
    // the Juvix binary or not.

    // context.subscriptions.push(vscode.commands.registerCommand(
    //     'juvix.getBinaryVersion', () => {
           
    //         vscode.window.showInformationMessage(juvixBinaryVersion, { modal: false });
    //     }

    // ));

    // // begin example of a modal:
    // const msg = vscode.commands.registerCommand(
    //     'juvix.typecheck', () => {
    //         vscode.window.showInformationMessage('Siii type checking errors', { modal: false });
    //         // vscode.ShellExecution()
    //     });
    // context.subscriptions.push(msg);
};

export function deactivate() { }