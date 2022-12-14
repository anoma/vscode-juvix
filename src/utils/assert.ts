/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/*
 * Adapted from vscode-lean sources.
 * See https://github.com/leanprover/vscode-lean
 */

export function assert(condition: () => boolean): void {
  if (!condition()) {
    const msg = `Assert failed: "${condition.toString()}" must be true, but was not!`;
    console.error(msg);
    throw new Error(msg);
  }
}
