# Juvix Plugin for VSCode [![Build, Lint, and Deploy](https://github.com/anoma/vscode-juvix/actions/workflows/ci.yaml/badge.svg)](https://github.com/anoma/vscode-juvix/actions/workflows/ci.yaml)

This VS Code extension provides support for [Juvix Lang](https://github.com/anoma/juvix).

<p align="center">
  <img src="https://github.com/anoma/vscode-juvix/raw/main/assets/juvix-vscode-extension.png" >
</p>
# Juvix VSCode Extension

## Quick Start

### Installation via Marketplace

1. Search for "Juvix" in the VSCode marketplace and install it.
2. Alternatively, launch VS Code Quick Open (<kbd>Ctrl</kbd>+<kbd>P</kbd>), paste the following command, and press Enter:

   ```
   ext install heliax.juvix-mode
   ```

### Manual Installation

If you prefer to install the extension manually, run the following commands:

```bash
git clone https://github.com/anoma/vscode-juvix
cd vscode-juvix
npm install
npx vsce package
code --install-extension juvix-X.X.X.vsix
```

To install `vsce` or `npx`, use:

```bash
npm install -g vsce
npm install -g npx
```

## Prerequisites

Ensure you have the latest binary of Juvix installed. Detailed installation instructions are available [here](https://docs.juvix.org/#installation).

However, the extension also offers an easy way to install the binary for your system. Search for the command "Juvix: Install Juvix Binary" if the pop-up message does not suggest the installation when you open a Juvix file.

For macOS users, install Juvix using Homebrew:

```bash
brew tap anoma/juvix
brew install juvix
```

Verify your Juvix installation with:

```bash
juvix --version
```

## Usage

This extension provides semantic syntax highlighting for Juvix files and multiple commands accessible through the Command Palette. Note that you need to edit Juvix files within a workspace folder for the extension to function correctly.

### Command Palette

Use <kbd>Ctrl</kbd>+<kbd>P</kbd> to open the Command Palette and type `Juvix`. Available commands include:

| Command   |                    Keymap                    |
| :-------- | :------------------------------------------: |
| typecheck | <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd> |
| compile   | <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> |
| run       | <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd> |
| doctor    | <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> |

## Configuration

Configure this extension via the VSCode settings UI.

1. Open the VSCode settings menu:

   - Navigate to **File** > **Preferences** > **Settings**.
   - Or quickly open the settings using <kbd>Ctrl</kbd>+<kbd>,</kbd> (Windows/Linux) or <kbd>Cmd</kbd>+<kbd>,</kbd> (macOS).

2. In the search bar, type `Juvix` to filter relevant settings.

3. Adjust the various options provided to fine-tune your development experience according to your needs.

Some common settings you can tweak include:

- Typecking extra arguments
- Compilation targets and extra arguments to pass to the compiler
- REPL and Execution Preferences: Customize how the REPL operates and how code execution is handled.
- And more ...

Make sure to reload the window if prompted for some changes to take effect.

## Features

- **Type-checking, Compilation, and Execution** of Juvix code.
- **REPL Support** for interactive programming.
- **Documentation Viewer** (Judoc) for Juvix.
- **Code Formatting** tailored for Juvix.
- **Support for Literate Programming** with Juvix Markdown files (.juvix.md).
- **Semantic Syntax Highlighting** for improved readability.
- Themed editor support with both light and dark options.
- Intermediate Representations (IR) support:
  - **JuvixCore**: syntax highlighting, REPL, execution.
  - **JuvixAsm**: syntax highlighting.
  - **JuvixGeb**: syntax highlighting, REPL, execution.
  - **VampIR**: syntax highlighting, setup, compile, verify, prove commands.
- **User Configuration Options**, some requiring a window reload.
- **Unicode input support** via `czhang03.unicode-math-input` extension.

Enjoy coding with Juvix in VSCode!
