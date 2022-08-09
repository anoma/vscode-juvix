module VsCode.ExtensionContext where

import Control.Monad.Eff (Eff)
import VsCode (VSCODE)
import VsCode.ExtensionContext.Subscriptions (Subscriptions)

foreign import data ExtensionContext :: Type

foreign import subscriptions :: forall eff
  .  ExtensionContext
  -> Eff (vscode :: VSCODE | eff) Subscriptions
