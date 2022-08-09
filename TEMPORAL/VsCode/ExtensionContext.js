exports.subscriptions =
  function(extensionContext) {
    return function() {
      return extensionContext.subscriptions
    }
  }