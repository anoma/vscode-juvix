exports.push =
  function(subscriptions) {
    return function(disposable) {
      return function() {
        subscriptions.push(disposable)
        return subscriptions
      }
    }
  }