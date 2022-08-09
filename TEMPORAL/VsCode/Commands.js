const vscode = require('vscode')

exports.registerCommand =
  function(command) {
    return function(callback) {
      return function() {
        const disposable = vscode.commands.registerCommand(command, callback)
        return disposable
      }
    }
  }