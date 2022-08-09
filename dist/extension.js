"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// output/Effect.Console/foreign.js
var log;
var init_foreign = __esm({
  "output/Effect.Console/foreign.js"() {
    "use strict";
    log = function(s) {
      return function() {
        console.log(s);
      };
    };
  }
});

// output/Data.Show/foreign.js
var init_foreign2 = __esm({
  "output/Data.Show/foreign.js"() {
    "use strict";
  }
});

// output/Data.Symbol/foreign.js
var init_foreign3 = __esm({
  "output/Data.Symbol/foreign.js"() {
    "use strict";
  }
});

// output/Type.Proxy/index.js
var init_Type = __esm({
  "output/Type.Proxy/index.js"() {
    "use strict";
  }
});

// output/Data.Symbol/index.js
var init_Data = __esm({
  "output/Data.Symbol/index.js"() {
    "use strict";
    init_foreign3();
    init_Type();
  }
});

// output/Record.Unsafe/foreign.js
var init_foreign4 = __esm({
  "output/Record.Unsafe/foreign.js"() {
    "use strict";
  }
});

// output/Record.Unsafe/index.js
var init_Record = __esm({
  "output/Record.Unsafe/index.js"() {
    "use strict";
    init_foreign4();
    init_foreign4();
  }
});

// output/Data.Show/index.js
var init_Data2 = __esm({
  "output/Data.Show/index.js"() {
    "use strict";
    init_foreign2();
    init_Data();
    init_Record();
    init_Type();
  }
});

// output/Effect.Console/index.js
var init_Effect = __esm({
  "output/Effect.Console/index.js"() {
    "use strict";
    init_foreign();
    init_Data2();
    init_foreign();
  }
});

// output/Main/index.js
var Main_exports = {};
__export(Main_exports, {
  main: () => main
});
var main;
var init_Main = __esm({
  "output/Main/index.js"() {
    "use strict";
    init_Effect();
    main = /* @__PURE__ */ log("\u{1F35D}");
  }
});

// output/extension.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
var vscode = require("vscode");
function activate(context) {
  console.log("Juvix Extension is now active!");
  const msg = vscode.commands.registerCommand("juvix.typecheck", () => {
    vscode.window.showInformationMessage("No type checking errors", { modal: false });
  });
  context.subscriptions.push(msg);
  const activatePS = (init_Main(), __toCommonJS(Main_exports)).main;
}
exports.activate = activate;
