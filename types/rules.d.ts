declare const _exports: {
    DupeFinder: typeof dupefinder.DupeFinder;
    IsInitializable: typeof tincustom.IsInitializable;
    IsMultipleBalanceOfSameFunc: typeof tincustom.IsMultipleBalanceOfSameFunc;
    Stats: typeof Stats;
    GenericGrep: typeof GenericGrep;
};
export = _exports;
import dupefinder = require("./rules/dupefinder");
import tincustom = require("./rules/tincustom");
import { Stats } from "./rules/builtin";
import { GenericGrep } from "./rules/builtin";
