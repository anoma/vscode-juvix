/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { debugChannel } from './utils/debug';
import { JuvixConfig } from './config';
import { isJuvixFile } from './utils/base';

export function activate(context: vscode.ExtensionContext) {
  const config = new JuvixConfig();

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'juvix-mode.createOrShowJudoc',
      () => {
        // if (JudocPanel.currentPanel) {
        //   // JudocPanel.;
        // }
        // else
        JudocPanel.createOrShow(config);
      }
    )
  );

  vscode.languages.registerHoverProvider(
    'javascript',
    new (class implements vscode.HoverProvider {
      provideHover(
        document: vscode.TextDocument,
        _position: vscode.Position,
        _token: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.Hover> {
        const args = [{ resourceUri: document.uri }];
        const stageCommandUri = vscode.Uri.parse(
          `command:git.stage?${encodeURIComponent(JSON.stringify(args))}`
        );
        const contents = new vscode.MarkdownString(`[Stage file](${stageCommandUri})`);
        contents.isTrusted = true;
        return new vscode.Hover(contents);
      }
    })()
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(JudocPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        console.log(`Got state: ${state}`);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions();
        JudocPanel.revive(webviewPanel);
      },
    });
  }
}

function getWebviewOptions(_contentPath?:string): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,
    enableCommandUris: true,
    // And restrict the webview to only loading content from our extension's `media` directory.
    // localResourceRoots: [contentPath ? vscode.Uri.file(contentPath) : vscode.Uri.file(path.join(__dirname, '..', 'media'))]
  };
}

/**
 * Manages Judoc webview panels
 */
export class JudocPanel {
  public static currentPanel: JudocPanel | undefined;
  public static juvixDocument: vscode.TextDocument;

  public static readonly viewType = 'juvix-mode';
  public readonly assetsPath = 'assets';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  public  readonly htmlFolder : string;

  public static createOrShow(config: JuvixConfig) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isJuvixFile(editor.document)) return;
    this.juvixDocument = editor.document;
    // If we already have a panel, show it.
    if (JudocPanel.currentPanel) {
      JudocPanel.currentPanel._panel.reveal();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      JudocPanel.viewType,
      'Html preview',
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      getWebviewOptions()
    );

    JudocPanel.currentPanel = new JudocPanel(panel, config.getJudocdDir());
  }

  public static revive(panel: vscode.WebviewPanel) {
    const config = new JuvixConfig();
    JudocPanel.currentPanel = new JudocPanel(panel,  config.getJudocdDir());
  }

  private constructor(panel: vscode.WebviewPanel, htmlFolder: string) {
    this._panel = panel;
    this.htmlFolder = htmlFolder;
    this._disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (document ===JudocPanel.juvixDocument) {
          this._update();
        }
      })
    );

    this._disposables.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        if (document ===JudocPanel.juvixDocument) {
          this._panel.dispose();
          this.dispose();
        }
      })
    );

    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor((e) => {
        if (!e || !isJuvixFile(e.document)) return;
        JudocPanel.juvixDocument = e.document;
        this._update();
      })
    );


    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      _e => {
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
    this._panel.title = 'Juvix Documentation viewer';
    const html = this._getHtmlForWebview(webview);
    if (html) this._panel.webview.html = html;
    else this._panel.webview.html = 'No active Juvix document';
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const doc = JudocPanel.juvixDocument;
    if (!doc || (doc && !isJuvixFile(doc))) return;

    const docFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    if (!docFolder) return;
    const config = new JuvixConfig();
    
    debugChannel.info("htmlFolder> " + this.htmlFolder);

    // const judocDocFolderUri = vscode.Uri.file(this.htmlFolder);
    // const judocDocFolderUri = vscode.Uri.file(config.getInternalBuildDir());
    const judocDocFolderUri = vscode.Uri.joinPath(docFolder.uri, 'html');

    const { spawnSync } = require('child_process');

    const vscodePrefix = webview.asWebviewUri(judocDocFolderUri).toString()+"/";
    const judocCall = [
      config.getJuvixExec(),
      config.getGlobalFlags(),
      'html',
      '--output-dir',
      // this.htmlFolder,
      judocDocFolderUri.fsPath,
      '--prefix-assets',
      vscodePrefix,
      '--prefix-url',
     vscodePrefix,
      doc.uri.fsPath,
    ].join(' ');
    debugChannel.info('Judoc call', judocCall);

    const ls = spawnSync(judocCall, {
      shell: true,
      encoding: 'utf8',
    });

    if (ls.status !== 0) {
      const errMsg: string = "Juvix's Error: " + ls.stderr.toString();
      debugChannel.error('Judoc failed', errMsg);
      throw new Error(errMsg);
    }
  
    const juvixRootCall = [
        config.getJuvixExec(),
        config.getGlobalFlags(),
        'dev',
        'root',
        doc.uri.fsPath
      ].join(' ');

    const rootRun = spawnSync(juvixRootCall, { shell:true, encoding: 'utf8'});
    if (rootRun.status !== 0) {
      const errMsg: string = "Juvix's Error: " + rootRun.stderr.toString();
      debugChannel.error('Juvix root failed for Judoc gen:', errMsg);
      throw new Error(errMsg);
    }
    const juvixRoot = rootRun.stdout.toString().trim();
    const htmlFilename =  doc.uri.fsPath
      .replace(juvixRoot, '')
      .replace('/', '.')
      .replace('.juvix', '.html');

    const htmlByJudocForDoc = vscode.Uri.joinPath(
        judocDocFolderUri,
        htmlFilename
      ).fsPath;
    debugChannel.info('Rendering...', htmlByJudocForDoc);

    const contentDisk: string = fs.readFileSync(htmlByJudocForDoc, 'utf8');

    const assetsUri = vscode.Uri.joinPath(judocDocFolderUri, 'assets');
    debugChannel.info('Assets Path', assetsUri);
    debugChannel.info('Assets URI', webview.asWebviewUri(assetsUri));

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return contentDisk
      .replace(
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src ' +
        webview.cspSource +
        '; img-src ' +
        webview.cspSource +
        " https:; script-src 'nonce-" +
        nonce +
        '\';">'
      );
  }
}

export function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
