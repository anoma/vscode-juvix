<!--
 Adapted from vscode-lean sources.
 See https://github.com/leanprover/vscode-lean
-->

# Abbreviation Feature

Edit [abbreviations.json](./abbreviations.json) to add common abbreviations.
Use `$CURSOR` to set the new location of the cursor after replacement.

## Caveat

If VS Code adds certain characters automatically (like `]` after typing `[`),
ensure that each such subword is a strict prefix of another abbreviation.

### Example

Assume that there are the abbreviations `[] -> A` and `[[]] -> B` and that the user wants to get the symbol `B`, so they type

- `\`, full text: `\`
- `[`, full text: `\[]` - this is a longest abbreviation! It gets replaced with `A`.
- `[`, full text: `A[]` - this is not what the user wanted.

Instead, also add the abbreviation `[]_ -> A`:

- `\`, full text: `\`
- `[`, full text: `\[]` - this could be either `\[]` or `\[]_`.
- `[`, full text: `\[[]]` - this matches the longest abbreviation `[[]]`, so it gets replaced with `B`.
