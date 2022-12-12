# vscode-juvix

Install the Juvix syntax highlighting extension by running the following
command on your prefered shell.

```
git clone https://github.com/anoma/vscode-juvix ~/.vscode/extensions
```

## Development

You must install `npm`, `typescript` and `vsce` to build the extension.

Run the following command to publish the extension to the marketplace.

```
npm run vscode:prepublish
vsce package
vsce publish name-of-the-version
```

The name-of-the-version must correspond to the version in the `package.json` file.
