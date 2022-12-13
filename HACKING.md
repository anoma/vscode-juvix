# vscode-juvix

Install the Juvix syntax highlighting extension by running the following
command on your prefered shell.

```bash
git clone https://github.com/anoma/vscode-juvix ~/.vscode/extensions
```

## Development

You must install `npm`, `typescript` and `vsce` to build the extension.

During development to get instant feedback on your changes
you can run the following command to compile the extension
and let it run in the current VSCode instance.

```bash
npm run watch
```

Now, with the `vscode-juvix` folder open in VSCode, press `F5` to start a new VSCode instance with the extension loaded. The extension will be reloaded automatically on changes. If not, you can press '`' to load the changes.

On the client side, the Juvix plugin will create an output channel called `Juvix` where you can see the output of the extension.

Once you are happy with your changes, you can run the following command to compile the extension

```bash
vsce package
```

This will create a `.vsix` file in the root directory of the project. You can install this file in VSCode by pressing `F1` and typing `Extensions: Install from VSIX...`.

## Publishing

The following steps assume that you have a publisher account.
Conntact the Juvix team to get access to the publisher account.
Assuming you have access to the publisher account, you can publish the extension by running the following commands.

```
npm run vscode:prepublish
vsce package
vsce publish name-of-the-version
```

The name-of-the-version must correspond to the version in the `package.json` file.
