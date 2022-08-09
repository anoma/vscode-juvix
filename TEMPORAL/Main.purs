module Main

  where

import Prelude

-- import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log)
-- import Control.Monad.Eff.Unsafe (unsafePerformEff)
-- import VsCode (VSCODE)
-- import VsCode.Commands (registerCommand)
-- import VsCode.ExtensionContext (ExtensionContext, subscriptions)
-- import VsCode.ExtensionContext.Subscriptions (push)
-- import VsCode.Window (showInformationMessage)

-- activateEff :: forall eff
--   .  ExtensionContext
--   -> Eff ( console :: CONSOLE
--          , vscode :: VSCODE
--          | eff)
--          Unit
-- activateEff ctx = void do
--   log "PureScript extension activated"
--   disposable <- registerCommand "extension.sayHello" $
--     showInformationMessage "Hello World!"
--   ss <- subscriptions ctx
--   push ss disposable

-- activate :: ExtensionContext -> Unit
-- activate ctx = unsafePerformEff $ activateEff ctx

-- deactivate :: forall eff
--   . Eff ( console :: CONSOLE
--         , vscode :: VSCODE
--         | eff)
--         Unit
-- deactivate = do
--   log "PureScript extension deactivated"
