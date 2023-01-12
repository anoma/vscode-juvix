
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { debugChannel } from './utils/debug';
import { JuvixConfig } from './config';
import { isJuvixFile } from './utils/base';

export const cats = {
  'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('juvix-mode.createOrShowJudoc', () => {
      JudocPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('juvix-mode.doRefactor', () => {
      if (JudocPanel.currentPanel) {
        JudocPanel.currentPanel.doRefactor();
      }
    })
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(JudocPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        console.log(`Got state: ${state}`);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        JudocPanel.revive(webviewPanel, context.extensionUri);
      }
    });
  }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    // localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
  };
}

/**
 * Manages Judoc webview panels
 */
export class JudocPanel {

  public static currentPanel: JudocPanel | undefined;

  public static readonly viewType = 'juvix-mode';
  public readonly assetsPath = 'assets';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {

    // If we already have a panel, show it.
    if (JudocPanel.currentPanel) {
      JudocPanel.currentPanel._panel.reveal();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      JudocPanel.viewType,
      'Juvix Documentation viewer',
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false
      },
      getWebviewOptions(extensionUri),
    );

    JudocPanel.currentPanel = new JudocPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    JudocPanel.currentPanel = new JudocPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public doRefactor() {
    // Send a message to the webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: 'refactor' });
  }

  public dispose() {
    JudocPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._updateForHTML(webview);
  }

  private _updateForHTML(webview: vscode.Webview) {
    this._panel.title = 'Juvix Documentation viewer';
    const html = this._getHtmlForWebview(webview);
    if (html) this._panel.webview.html = html;
    else this._panel.webview.html = 'No active Juvix document';
  }

  private _getHtmlForWebview(webview: vscode.Webview) {

    const doc = vscode.window.activeTextEditor?.document;
    if (!doc || doc && !isJuvixFile(doc)) return;
    // const HTML =;

    // doc.getText();
    // const contentDisk: string = fs.readFileSync(filePath, 'utf8');

    const docFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    if (!docFolder) return;
    const judocDocFolder = vscode.Uri.joinPath(docFolder.uri, 'doc');

    const config = new JuvixConfig();
    const { spawnSync } = require('child_process');

    const judocCall = [
      config.getJuvixExec(),
      config.getGlobalFlags(),
      'dev',
      'doc',
      '--output-dir',
      judocDocFolder.fsPath,
      doc.uri.fsPath
    ].join(' ');
    debugChannel.info('Judoc call', judocCall);

    const ls = spawnSync(judocCall, {
      shell: true,
      encoding: 'utf8'
    });

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      debugChannel.error('Judoc failed', errMsg);
      throw new Error(errMsg);
    }
    const htmlByJudocForDoc = vscode.Uri.joinPath(
      judocDocFolder,
      path.basename(doc.uri.fsPath).replace('.juvix', '.html')).fsPath;
    debugChannel.info('Rendering...', htmlByJudocForDoc);

    const contentDisk: string = fs.readFileSync(
      htmlByJudocForDoc, 'utf8');

    const assetsUri = vscode.Uri.joinPath(judocDocFolder, 'assets');

    const highlightJS = vscode.Uri.joinPath(assetsUri, 'highlight.js');
    const highlightUri = webview.asWebviewUri(highlightJS);

    // Local path to css styles
    const sourceAyuLightCss = vscode.Uri.joinPath(assetsUri,
      'source-ayu-light.css');
    const linuwialCss = vscode.Uri.joinPath(assetsUri,
      'linuwial.css');
    const sourceNordCss = vscode.Uri.joinPath(assetsUri,
      'source-nord.cs');

    const taraSeatingSVG = vscode.Uri.joinPath(assetsUri, 'seating-mascot.051c86a.svg');
    const taraTeachingSVG = vscode.Uri.joinPath(assetsUri, 'teaching-mascot.f828959.svg');
    const taraSmilingSVG = vscode.Uri.joinPath(assetsUri, 'Seating_Tara_smiling.svg');


    // Uri to load styles into webview
    const sourceAyuLightUri = webview.asWebviewUri(sourceAyuLightCss);
    const linuwialUri = webview.asWebviewUri(linuwialCss);
    const sourceNordUri = webview.asWebviewUri(sourceNordCss);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    const withVScodeInfo = contentDisk
      .replace(
      'href="assets/source-ayu-light.css"', 'href="' + sourceAyuLightUri + '"')
      .replace(
        'href="assets/linuwial.css"', 'href="' + linuwialUri + '"')
      .replace(
          'href="assets/source-nord.cs"', 'href="' + sourceNordUri + '"')
      .replace(
        'src="assets/highlight.js"',
        'nonce="' + nonce + '" src="' + highlightUri + '"'
        ).replace(
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
        "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src " + webview.cspSource + "; img-src " + webview.cspSource + " https:; script-src 'nonce-" + nonce + "';\">"
        )

    debugChannel.info('withSecurityInfo', withVScodeInfo);

    return withVScodeInfo;
  }
}

export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}