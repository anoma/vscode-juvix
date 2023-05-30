/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import { debugChannel } from './utils/debug';
import { JuvixConfig } from './config';
import { isJuvixFile } from './utils/base';
import { juvixRoot } from './root';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'juvix-mode.createOrShowJudoc',
      () => {
        JudocPanel.createOrShow();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'juvix-mode.createOrShowJudocOnlySource',
      () => {
        JudocPanel.createOrShow(true);
      }
    )
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

function getWebviewOptions(): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,
    // enableCommandUris: true,
    // And restrict the webview to only loading content from our extension's `html` directory.
    // localResourceRoots: []
  };
}

/**
 * Manages Judoc webview panels
 */
export class JudocPanel {
  public static currentPanel: JudocPanel | undefined;
  public static juvixDocument: vscode.TextDocument;
  public static onlySource: boolean;

  public static readonly viewType = 'juvix-mode';
  public readonly assetsPath = 'assets';

  private _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(onlySource = false) {
    this.onlySource = onlySource;
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isJuvixFile(editor.document)) return;
    this.juvixDocument = editor.document;

    if (JudocPanel.currentPanel) {
      JudocPanel.currentPanel._panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      JudocPanel.viewType,
      'Html preview',
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      getWebviewOptions()
    );

    JudocPanel.currentPanel = new JudocPanel(panel);
  }

  public static revive(panel: vscode.WebviewPanel) {
    const config = new JuvixConfig();
    JudocPanel.currentPanel = new JudocPanel(panel, config.getJudocdDir());
  }

  private constructor(panel: vscode.WebviewPanel, _htmlFolder?: string) {
    this._panel = panel;

    this._disposables.push(
      vscode.workspace.onDidSaveTextDocument(document => {
        if (!isJuvixFile(document)) return;
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && document === activeEditor.document) {
          JudocPanel.juvixDocument = document;
          this._update();
        }
      })
    );

    this._disposables.push(
      vscode.workspace.onDidOpenTextDocument(document => {
        if (!isJuvixFile(document)) return;
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && document === activeEditor.document) {
          JudocPanel.juvixDocument = document;
          this._update();
        }
      })
    );

    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor(e => {
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
    // The html folder is the same as the juvixRoot folder.
    const config = new JuvixConfig();
    const projRoot = juvixRoot();
    const projRootUri = vscode.Uri.file(projRoot);
    const judocDocFolderUri = vscode.Uri.joinPath(projRootUri, 'html');

    const { spawnSync } = require('child_process');

    const vscodePrefix =
      webview.asWebviewUri(judocDocFolderUri).toString() + '/';

    const judocCall = [
      config.getJuvixExec(),
      '--internal-build-dir',
      judocDocFolderUri.fsPath,
      'html',
      JudocPanel.onlySource ? '--only-source' : '',
      '--output-dir',
      // this.htmlFolder,
      judocDocFolderUri.fsPath,
      '--non-recursive',
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
    const projRoot = juvixRoot();
    const htmlFilename = doc.uri.fsPath
      .replace(projRoot, '')
      .replace('/', '.')
      .replace('.juvix', '.html');

    const htmlByJudocForDoc = vscode.Uri.joinPath(
      judocDocFolderUri,
      htmlFilename
    ).fsPath;

    debugChannel.info('Rendering html file: ', htmlByJudocForDoc);

    const contentDisk: string = fs.readFileSync(htmlByJudocForDoc, 'utf8');

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return contentDisk.replace(
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
