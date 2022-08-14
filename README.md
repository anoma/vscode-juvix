# Juvix Plugin for VSCode

This extension provides support for the Juvix programming language.

<p align="center">
  <img src="assets/juvix-vscode-extension.png" >
</p>

## Checklist

- Commands/tasks for:

  - [x] typecheck (ctrl+c ctrl+l)
  - [x] compile (ctrl+c ctrl+c)
  - [x] run (ctrl+c ctrl+r)
  - [x] html
  - [x] internal parse
  - [x] internal scope

- Context menu (right-click) showing:

  - Juvix submenu
    - [x] typecheck
    - [x] compile
    - [x] run

- Problem matchers provider
  - [x] compiler errors
- [x] semantic syntax highlighting
- [x] snippets
- [x] go to definition (not for stdlib symbols)
- [ ] user configuration
- [ ] go to implementation
- [ ] find all references
- [ ] types on hover
- [ ] documentation hover
- [ ] highlight related
- [ ] code completion
- [ ] workspace symbol search
- [ ] hints for types and parameter names

## Quick start

Install [juvix](https://docs.juvix.org) and install the [vscode-juvix](https://github.com/anoma/vscode-juvix) extension.

## Configuration

This extension provides configurations using the VSCode's configuration UI settings.
