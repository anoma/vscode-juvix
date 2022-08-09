const vscode = require('vscode')

exports.showInformationMessage =
  function(message) {
    return function() {
      vscode.window.showInformationMessage(message)
    }
  }