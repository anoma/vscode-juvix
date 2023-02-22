# Extra features

If you are debugging Juvix programs, you might want to use the extension in
development mode. To do so, enable in your configuration the
`juvix-mode.enableDevTasks` option. This will enable the extension to open a
panel and run the tasks specified in the active file. However, you can use
this feature even if it's not a Juvix file.

The extension will look for lines in the active file that contain the pattern
`DEBUG: nameTASK` where `nameTask` is an entry in the `juvix-mode.devTasks`
configuration option. Check the extension configuration to see some examples you
can use or add to your setup. Some strings are expanded in runtime. For
example, `$filename` will be replaced by the name of the active file. The
extension provides auto-completion for the default tasks. To trigger this feature,
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
