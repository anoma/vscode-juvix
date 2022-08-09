module VsCode.Commands where

import Prelude
import Control.Monad.Eff (Eff)
import VsCode (VSCODE)
import VsCode.Disposable (Disposable)

foreign import registerCommand :: forall eff
  .  String
  -> Eff (vscode :: VSCODE | eff) Unit
  -> Eff (vscode :: VSCODE | eff) Disposable