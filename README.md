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
| repl      | <kbd>Shift+Alt+R</kbd> |
| doctor    | <kbd>Shift+Alt+D</kbd> |

However, we recommend using the Command Palette (<kbd>Ctrl</kbd><kbd>P</kbd>) to
see which other commands are available by typing `Juvix` and select the command you want to run.

## Configuration

This extension provides configurations using the VSCode's configuration UI
settings.

## Extra features

If you are debugging Juvix programs, you might want to use the extension in
development mode. To do so, enable in your configuration the
`juvix-mode.enableDevTasks` option. This will enable the extension to open a
panel and run the tasks specified in the active file. However, you can use
this feature even if it's not a Juvix file.

The extension will look for lines in the active file that contain the pattern
`DEBUG: nameTASK` where `nameTask` is an entry in the `juvix-mode.devTasks`
configuration option. Check the extension configuration to see some examples you
can use or add your own setup. Some strings are expanded in runtime. For
example, `$filename` will be replaced by the name of the active file. The
extension provides autocompletion for the default tasks. To triger this feature,
start typing `debug` somewhere in the file.

For example, if you have the following line in your configuration file:

```json
 "juvix-mode.enableDevTasks" : true,
 "juvix-mode.devTasks": {
    "CatFile": "cat $filename"
}
```

Then, you can use the task `Parsed` in your file by adding the following line:

```
-- DEBUG: Parsed
module B;
axiom A : Type;
end;
```

The extension will run the command for the `Parsed` task in a new tab and update
that view when the file changes. If the active file contains multiple `DEBUG`
annotations, the extension will run all the commands in separate tabs. For
example, if you have the following lines in your file, the extension will open
two tabs, one for the `InternalArity` task and another for the `CoreLifting`

```
module A;
open import B;
axiom a : A;
axiom b : A;
end;
-- DEBUG: InternalArity
-- DEBUG: CoreLifting
```

To keep your debug annotations but not run the tasks on save, you can add the
`NO-DEBUG!` annotation, somewhere in the file. To run all the available tasks,
include `DEBUG: All`.

```
-- NO-DEBUG!
-- DEBUG: All
module B;
axiom A : Type;
end;
```

The aforementioned features are experimental and might change in the future.

## Features

- Command palette with typechecking, compilation, and running Juvix files.
- Semantic syntax highlighting.
- Support for light and dark themes.
- Support for Unicode input (e.g. λ, Π, Σ, etc.) pressing e.g. `\` + "alpha" + `space`.
- Support for user configuration options.
- Support for Juvix's REPL.
- Support for Juvix's debugging.
