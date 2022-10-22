/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';

export const TASK_TYPE = 'Juvix';

export interface JuvixTaskDefinition extends vscode.TaskDefinition {
  command?: string;
  args?: string[];
}

export class JuvixTaskProvider implements vscode.TaskProvider {
  async provideTasks(): Promise<vscode.Task[]> {
    const config = new user.JuvixConfig();
    console.log('CONFIG');
    console.log(config);
    const setupPanel = () => {
      let panelOpt: vscode.TaskRevealKind;
      switch (config.revealPanel) {
        case 'silent':
          panelOpt = vscode.TaskRevealKind.Silent;
          break;
        case 'never':
          panelOpt = vscode.TaskRevealKind.Never;
          break;
        default:
          panelOpt = vscode.TaskRevealKind.Always;
      }
      return panelOpt;
    };

    const defs = [
      {
        command: 'doctor',
        args: [],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'typecheck',
        args: ['${file}', config.getGlobalFlags()],
        group: vscode.TaskGroup.Build,
        reveal: setupPanel(),
      },
      {
        command: 'compile',
        args: [
          config.getCompilationFlags(),
          '${file}',
          config.getGlobalFlags(),
        ],
        group: vscode.TaskGroup.Build,
        reveal: setupPanel(),
      },
      {
        command: 'run',
        args: ['${file}', config.getGlobalFlags()],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'html',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'dev parse',
        args: ['${file}', config.getGlobalFlags()],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'dev scope',
        args: ['${file}', config.getGlobalFlags()],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
    ];
    console.log('CMDS');
    console.log(defs);

    const tasks: vscode.Task[] = [];

    for (const workspaceTarget of vscode.workspace.workspaceFolders || []) {
      for (const def of defs) {
        const vscodeTask = await JuvixTask(
          workspaceTarget, // workspace
          { type: TASK_TYPE, command: def.command }, // definition
          def.command, // name
          [def.command].concat(def.args ?? []) // args
        );
        vscodeTask.group = def.group;
        vscodeTask.problemMatchers = ['$juvixerror'];
        vscodeTask.presentationOptions = {
          reveal: def.reveal,
          showReuseMessage: false,
          focus: false,
          echo: false,
          clear: true,
        };
        tasks.push(vscodeTask);
      }
    }
    return tasks;
  }

  async resolveTask(task: vscode.Task): Promise<vscode.Task | undefined> {
    const definition = task.definition as JuvixTaskDefinition;
    if (definition.type === TASK_TYPE && definition.command) {
      const args = [definition.command].concat(definition.args ?? []);
      return await JuvixTask(task.scope, definition, task.name, args);
    }
    return undefined;
  }
}

export async function JuvixTask(
  scope: vscode.WorkspaceFolder | vscode.TaskScope | undefined,
  definition: JuvixTaskDefinition,
  name: string,
  args: string[]
): Promise<vscode.Task> {
  let exec: vscode.ProcessExecution | vscode.ShellExecution | undefined =
    undefined;
  const config = new user.JuvixConfig();
  // TODO: define a custom execution for the juvix binary
  let input = args.join(' ').trim();
  console.log('INPUT>>>>');
  console.log(input);
  if (!exec) {
    switch (name) {
      case 'run':
        input = args.slice(1).join(' ');
        exec = new vscode.ShellExecution(
          config.getJuvixExec() +
            ` compile ${input} && wasmer \${fileDirname}\${pathSeparator}\${fileBasenameNoExtension}.wasm`
        );
        break;
      default:
        exec = new vscode.ShellExecution(config.getJuvixExec() + `  ${input}`);
        break;
    }
  }
  return new vscode.Task(
    definition,
    scope ?? vscode.TaskScope.Workspace,
    name,
    TASK_TYPE,
    exec,
    ['$juvixerror']
  );
}
