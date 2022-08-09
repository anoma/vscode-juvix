module VsCode.Window where

import Prelude
import Control.Monad.Eff (Eff)
import VsCode (VSCODE)

foreign import showInformationMessage :: forall eff
  .  String
  -> Eff (vscode :: VSCODE | eff) Unit