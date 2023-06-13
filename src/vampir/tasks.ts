/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import { logger } from '../utils/debug';
import { JuvixConfig } from '../config';

export const TASK_TYPE = 'VampIR';

export async function activate(context: vscode.ExtensionContext) {
  if (vscode.workspace.workspaceFolders === undefined) {
    const msg = 'VampIR extension requires at least one workspace open.\n';
    vscode.window.showErrorMessage(msg);
    logger.warn(msg);
    return;
  }

  const provider = new VampIRProvider();
  const vampIRTasks: Promise<vscode.Task[]> = provider.provideTasks();
  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(TASK_TYPE, provider)
  );

  vampIRTasks
    .then(tasks => {
      for (const task of tasks) {
        const cmdName = task.name;
        const qualifiedCmdName = 'juvix-mode.vampir-' + cmdName;
        const cmd = vscode.commands.registerTextEditorCommand(
          qualifiedCmdName,
          () => {
            const ex = vscode.tasks.executeTask(task);
            ex.then((v: vscode.TaskExecution) => {
              v.terminate();
              return true;
            });
            return false;
          }
        );
        context.subscriptions.push(cmd);
      }
    })
    .catch(err => {
      logger.error('VampIR Task provider error: ' + err);
    });
}

export interface VampIRDefinition extends vscode.TaskDefinition {
  command?: string;
  args?: string[];
}

export class VampIRProvider implements vscode.TaskProvider {
  async provideTasks(): Promise<vscode.Task[]> {
    const config = new JuvixConfig();

    const defs = [
      {
        command: 'setup',
        args: ['--unchecked', '-o', 'params.pp'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'compile',
        args: [
          '-u',
          'params.pp',
          '--unchecked',
          '-s',
          '${file}',
          '-o',
          '${fileBasenameNoExtension}.plonk',
        ],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        // prove -u params.pp --unchecked -c range.plonk -o range.proof
        command: 'prove',
        args: [
          '-u',
          'params.pp',
          '--unchecked',
          '-c',
          '${fileBasenameNoExtension}.plonk',
          '-o',
          '${fileBasenameNoExtension}.proof',
        ],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        //vamp-ir verify -u params.pp --unchecked -c range.plonk -p range.proof
        command: 'verify',
        args: [
          '-u',
          'params.pp',
          '--unchecked',
          '-c',
          '${fileBasenameNoExtension}.plonk',
          '-p',
          '${fileBasenameNoExtension}.proof',
        ],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
    ];

    const tasks: vscode.Task[] = [];

    for (const def of defs) {
      const vscodeTask = await VampIR(
        { type: TASK_TYPE, command: def.command }, // definition
        def.command, // name
        [def.command].concat(def.args ?? []) // args
      );
      vscodeTask.group = def.group;
      vscodeTask.problemMatchers = ['$rusterror'];
      vscodeTask.presentationOptions = {
        reveal: def.reveal,
        showReuseMessage: false,
        panel: vscode.TaskPanelKind.Shared,
        focus: false,
        echo: false,
        clear: true,
      };
      vscodeTask.runOptions = {
        reevaluateOnRerun: true,
      };
      tasks.push(vscodeTask);
    }
    return tasks;
  }

  async resolveTask(task: any): Promise<vscode.Task | undefined> {
    const definition = task.definition as VampIRDefinition;
    if (definition.type === TASK_TYPE && definition.command) {
      const args = [definition.command].concat(definition.args ?? []);
      return await VampIR(definition, task.name, args);
    }
    return undefined;
  }
}

export async function VampIR(
  definition: VampIRDefinition,
  name: string,
  args: string[]
): Promise<vscode.Task> {
  const input = args.join(' ').trim();
  const config = new JuvixConfig();
  const VampirExec = config.getVampirExec();
  const exec = new vscode.ShellExecution(VampirExec + ` ${input}`);
  return new vscode.Task(
    definition,
    vscode.TaskScope.Global,
    name,
    TASK_TYPE,
    exec,
    ['$juvixerror']
  );
}
