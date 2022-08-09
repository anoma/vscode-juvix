module VsCode.ExtensionContext.Subscriptions where

import Control.Monad.Eff (Eff)
import VsCode (VSCODE)
import VsCode.Disposable (Disposable)

foreign import data Subscriptions :: Type

foreign import push :: forall eff
  .  Subscriptions
  -> Disposable
  -> Eff (vscode :: VSCODE | eff) Subscriptions
