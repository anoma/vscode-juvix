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

