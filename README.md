# Juvix Plugin for VSCode

This VS Code extension provides support for [Juvix Lang](https://github.com/anoma/juvix).

<p align="center">
  <img src="https://github.com/anoma/vscode-juvix/raw/main/assets/juvix-vscode-extension.png" >
</p>

## Quick start

Find "Juvix" in the VSCode marketplace and install it. Otherwise, launch VS Code Quick Open (<kbd>Ctrl</kbd><kbd>P</kbd>), and paste the following command followed by pressing enter.

```
ext install heliax.juvix-mode
```

## Pre-requisites

To be able to use the extension, you need to have the latest binary of Juvix installed. You can find detailed installation instructions [here](https://docs.juvix.org/#installation). If you are using MacOS, you can install Juvix using Homebrew.

```bash
brew tap anoma/juvix
brew install juvix
```
 
Once you have Juvix installed, you can check the version by running the following command.

```bash
juvix --version
```

## Usage

The extension provides semantic syntax highlighting for Juvix files. It also provides a command palette with the following commands. You must edit Juvix files within a workspace folder. Otherwise, the extension will not work properly.

| Command   |         Keymap          |
| :-------- | :---------------------: |
| typecheck | <kbd>Ctrl+Shift+T</kbd> |
| compile   | <kbd>Ctrl+Shift+C</kbd> |
| run       | <kbd>Ctrl+Shift+R</kbd> |
| doctor    | <kbd>Ctrl+Shift+D</kbd> |

Find out other commands in the Command Pallete (press <kbd>Ctrl</kbd><kbd>P</kbd>
and type `Juvix` to see all the related commands).

## Configuration

This extension provides configurations using the VSCode's configuration UI settings.

## Features

- Command palette with typechecking, compilation, and running Juvix files.
- Semantic syntax highlighting.
- Support for light and dark themes.
- Support for Unicode input (e.g. λ, Π, Σ, etc.), as pressing <kbd>\</kbd> + `alpha` to type α.
- Support for user configuration options.
- Support for Juvix's REPL (coming soon).
