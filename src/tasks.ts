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
  const juvixTasks: Promise<vscode.Task[]> = provider.provideTasks();
  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(TASK_TYPE, provider)
  );

  juvixTasks
    .then(tasks => {
      for (const task of tasks) {
        const cmdName = task.name.replace(' ', '-');
        const qualifiedCmdName = 'juvix-mode.' + cmdName;
        const cmd = vscode.commands.registerTextEditorCommand(
          qualifiedCmdName,
          () => {
            const ex = vscode.tasks.executeTask(task);
            ex.then((v: vscode.TaskExecution) => {
              debugChannel.info('Task "' + cmdName + '" executed');
              v.terminate();
              return true;
            });
            debugChannel.info('Task "' + cmdName + '" executed');
            return false;
          }
        );
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
      switch (config.revealPanel.get()) {
        case 'always':
          panelOpt = vscode.TaskRevealKind.Always;
          break;
        case 'never':
          panelOpt = vscode.TaskRevealKind.Never;
          break;
        default:
          panelOpt = vscode.TaskRevealKind.Silent;
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
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'compile',
        args: [config.getCompilationFlags(), '${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Silent,
      },
      {
        command: 'core-compile',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Silent,
      },
      {
        command: 'core-eval',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'geb-eval',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'geb-compile',
        args: ['${fileBasenameNoExtension}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
      },
      {
        command: 'geb-check',
        args: ['${file}'],
        group: vscode.TaskGroup.Build,
        reveal: vscode.TaskRevealKind.Always,
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
        reveal: vscode.TaskRevealKind.Silent,
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
    // debugChannel.info('Tasks to be added:');
    // debugChannel.info(JSON.stringify(tasks).toString());
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
  const buildDir = config.getInternalBuildDir();
  let fl = args.slice(1).join(' ').trim();
  switch (name) {
    case 'run':
      exec = new vscode.ShellExecution(
        JuvixExec +
          ` compile --output ${buildDir}\${pathSeparator}out ${fl} && ${buildDir}\${pathSeparator}out`,
        { cwd: buildDir }
      );
      break;
    case 'core-compile':
      exec = new vscode.ShellExecution(
        JuvixExec + ` dev core compile -t geb ${fl}`
      );
      break;
    case 'core-eval':
      exec = new vscode.ShellExecution(JuvixExec + ` dev core eval ${fl}`);
      break;
    case 'geb-compile':
      const gebCompile =
        config.getGebExec() +
        ` -i ${fl}.lisp -e "${fl}::*entry*" -l -v -o ${fl}.pir`;
      debugChannel.info(gebCompile);
      exec = new vscode.ShellExecution(gebCompile);
      break;
    case 'geb-eval':
      exec = new vscode.ShellExecution(JuvixExec + ` dev geb eval ${fl}`);
      break;
    case 'geb-check':
        exec = new vscode.ShellExecution(JuvixExec + ` dev geb check ${fl}`);
        break;
    default:
      exec = new vscode.ShellExecution(JuvixExec + `  ${input}`);
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
