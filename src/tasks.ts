/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as user from './config';
import { debugChannel } from './utils/debug';

export const TASK_TYPE = 'Juvix';

export async function activate(context: vscode.ExtensionContext) {
  /* Task provider.
  This is used to register the tasks that can be run from the command palette.
  */

  // At the moment, vscode requires at least one workspace folder to be open
  // in order to register a task provider. This is a limitation of the API.
  // If this changes in the future, we can remove the following error message.
  if (vscode.workspace.workspaceFolders === undefined) {
    const msg =
      'Juvix extension requires at least one workspace open.\n' +
      'Open a folder containing a Juvix project and try again    debugChannel.error(msg)';
    vscode.window.showErrorMessage(msg);
    debugChannel.error(msg);
    return;
  }

  const provider = new JuvixTaskProvider();
  const juvixTasks = provider.provideTasks();
  const taskProvider: vscode.Disposable = vscode.tasks.registerTaskProvider(
    TASK_TYPE,
    provider
  );

  juvixTasks
    .then(tasks => {
      for (const task of tasks) {
        const cmdName = task.name.replace(' ', '-');
        const qualifiedCmdName = 'juvix-mode.' + task.name.replace(' ', '-');
        const cmd = vscode.commands.registerCommand(qualifiedCmdName, () => {
          vscode.tasks.executeTask(task), { when: 'editorLangId == juvix' };
        });
        context.subscriptions.push(cmd);
        debugChannel.info('[!] "' + cmdName + '" command registered');
      }
    })
    .catch(err => {
      debugChannel.error('Task provider error: ' + err);
    });
}

export interface JuvixTaskDefinition extends vscode.TaskDefinition {
  command?: string;
  args?: string[];
}

export class JuvixTaskProvider implements vscode.TaskProvider {
  async provideTasks(): Promise<vscode.Task[]> {
    const config = new user.JuvixConfig();
    const setupPanel = () => {
      let panelOpt: vscode.TaskRevealKind;
      switch (config.revealPanel.toString()) {
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
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: setupPanel(),
      },
      {
        command: 'compile',
        args: [
          config.getCompilationFlags(),
          '${file}',
        ],
        group: vscode.TaskGroup.Build,
        reveal: setupPanel(),
      },
      {
        command: 'run',
        args: ['${file}'],
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
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'dev scope',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
    ];
    // debug.log('info', 'Commands to be added:');
    // debug.log('info', defs);

    const tasks: vscode.Task[] = [];

    for (const def of defs) {
      const vscodeTask = await JuvixTask(
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
    debugChannel.info('Tasks to be added:');
    debugChannel.info(JSON.stringify(tasks).toString());
    return tasks;
  }

  async resolveTask(task: any): Promise<vscode.Task | undefined> {
    const definition = task.definition as JuvixTaskDefinition;
    if (definition.type === TASK_TYPE && definition.command) {
      const args = [definition.command].concat(definition.args ?? []);
      return await JuvixTask(definition, task.name, args);
    }
    debugChannel.warn('resolveTask: fail to resolve', task);
    return undefined;
  }
}

export async function JuvixTask(
  definition: JuvixTaskDefinition,
  name: string,
  args: string[]
): Promise<vscode.Task> {
  let input = args.join(' ').trim();
  const config = new user.JuvixConfig();
  const JuvixExec = [config.getJuvixExec(), config.getGlobalFlags()].join(' ');
  let exec: vscode.ProcessExecution | vscode.ShellExecution | undefined;
  switch (name) {
    case 'run':
      input = args.slice(1).join(' ').trim();
      const buildDir = config.getInternalBuildDir();
     
      exec = new vscode.ShellExecution(
        JuvixExec +
          ` compile --output ${buildDir}\${pathSeparator}out ${input} && ${buildDir}\${pathSeparator}out`
          , { cwd: buildDir} 
      );
      break;
    default:
      exec = new vscode.ShellExecution(JuvixExec+ `  ${input}`);
      break;
  }
  return new vscode.Task(
    definition,
    vscode.TaskScope.Global,
    name,
    TASK_TYPE,
    exec,
    ['$juvixerror']
  );
}
