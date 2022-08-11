# vscode-juvix

Install the Juvix syntax highlighting extension by running the following
command on your prefered shell.

```
git clone https://github.com/anoma/vscode-juvix ~/.vscode/extensions
```

## Development

You must install `npm` , `purescript` , `typescript` , `spago`.

To build the extension:

```
npm run vscode:prepublish
```

For debugging:

```
npm run ts:watch
npm run ps:watch
```

## Publishing

Before to publish, run

```
vsce package
```

To see the content of the VSIX file, run:

```
vsce ls
```

To publish a new version (minor), run:

```
vsce publish minor
```

TODO: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#verify-a-publisher
