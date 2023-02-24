# Juvix Plugin for VSCode [![Build, Lint, and Deploy](https://github.com/anoma/vscode-juvix/actions/workflows/ci.yaml/badge.svg)](https://github.com/anoma/vscode-juvix/actions/workflows/ci.yaml)

This VS Code extension provides support for [Juvix Lang](https://github.com/anoma/juvix).

<p align="center">
  <img src="https://github.com/anoma/vscode-juvix/raw/main/assets/juvix-vscode-extension.png" >
</p>

## Quick start

Find "Juvix" in the VSCode marketplace and install it. Otherwise, launch VS Code
Quick Open (<kbd>Ctrl</kbd><kbd>P</kbd>), and paste the following command
followed by pressing enter.

```
ext install heliax.juvix-mode
```

If you, for some reason, want to install the extension manually,
you can do it by running the following commands.

```bash
git clone https://github.com/anoma/vscode-juvix
cd vscode-juvix
npm install
npx vsce package
code --install-extension juvix-X.X.X.vsix
```

If you don't have `vsce` or `npx` installed, you can install it by running the following:

```bash
npm install -g vsce
npm install -g npx
```

## Pre-requisites

To be able to use the extension, you need to have the latest binary of Juvix
installed. You can find detailed installation instructions
[here](https://docs.juvix.org/#installation). If you are using MacOS, you can
install Juvix using Homebrew.

```bash
brew tap anoma/juvix
brew install juvix
```

Once you have Juvix installed, you can check the version by running the
following command.

```bash
juvix --version
```

## Usage

The extension provides semantic syntax highlighting for Juvix files. It also
provides a command palette with the following commands. You must edit Juvix
files within a workspace folder. Otherwise, the extension will not work
properly.

| Command   |         Keymap         |
| :-------- | :--------------------: |
| typecheck | <kbd>Shift+Alt+T</kbd> |
| compile   | <kbd>Shift+Alt+C</kbd> |
| run       | <kbd>Shift+Alt+X</kbd> |
| repl      | <kbd>Shift+Alt+E</kbd> |
| doctor    | <kbd>Shift+Alt+D</kbd> |

However, we recommend using the Command Palette (<kbd>Ctrl</kbd><kbd>P</kbd>) to
see which other commands are available by typing `Juvix` and selecting the command you want to run.

## Configuration

This extension provides configurations using the VSCode's configuration UI
settings.

## Features

- Juvix type-checking, compilation and execution.
- Support for Juvix's REPL.
- Juvix Documentation viewer (Judoc).
- Juvix Formatting.
- Juvix Semantic syntax highlighting.
- Juvix theme with support for light and dark themes.
- Support for Juvix intermmediate representations (IR):
  - JuvixCore: syntax highlighting, REPL, and execution.
  - JuvixAsm: syntax highlighting.
  - JuvixGeb: syntax highlighting, REPL, and execution.
  - VampIR: syntax highlighting, commands: setup, compile, verify, and prove.
- Support for Unicode input (e.g. λ, Π, Σ, etc.) pressing e.g. `\` + "alpha" + `space`.
- Support for user configuration options (requires reloading the window in some cases).
- Support for Juvix's debugging through "--DEBUG: tasks" comments, see EXTRA.md for more information.
