# Juvix Plugin for VSCode

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

If you, for some reason, want to install the extension manually to your
personal VSCode extensions folder, you can run the following command.

```bash
git clone https://github.com/anoma/vscode-juvix ~/.vscode/extensions
```

To get the latest version of the extension, you can run the following command.

```bash
cd ~/.vscode/extensions/vscode-juvix
git pull origin main
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
| run       | <kbd>Shift+Alt+L</kbd> |
| doctor    | <kbd>Shift+Alt+D</kbd> |

However, we recommend using the Command Palette (<kbd>Ctrl</kbd><kbd>P</kbd>) to
see which other commands are available. You can also use the Command Palette to
run any of the commands above. To do so, type `Juvix` and select the command you
want to run.

## Configuration

This extension provides configurations using the VSCode's configuration UI
settings.

## Features

- Command palette with typechecking, compilation, and running Juvix files.
- Semantic syntax highlighting.
- Support for light and dark themes.
- Support for Unicode input (e.g. λ, Π, Σ, etc.), as pressing <kbd>\</kbd> + `alpha` to type α.
- Support for user configuration options.
- Support for Juvix's REPL (coming soon).
