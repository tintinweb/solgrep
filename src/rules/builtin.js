/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const utils = require('../utils');
const safeEval = require('safe-eval'); // @notice - this is not a safe eval!

class BaseRule {
    constructor(solgrep) {
        this.solgrep = solgrep;
    }

    onProcess(sourceUnit) {
        throw new Error("Not implemented");
    }
}
BaseRule.description = "N/A";

class GenericGrep extends BaseRule {
    constructor(solgrep, patterns) {
        super(solgrep);
        this.patterns = this._normalizePatterns(patterns);
    }

    _normalizePatterns(pat) {
        const remapFunction = /function\./ig;

        return pat.map(p => {
            if (p.includes("{") || p.includes("}") || p.includes("function ") || p.includes("class ") || p.includes("this.") || p.includes("async") || p.includes("require") || p.includes("\n")) {
                throw new Error("Invalid pattern: " + p);
            }
            return p.replace(remapFunction, '_function.')

        }).filter(p => p.length > 0);
    }

    _getPatternType(p) {
        if (p.includes("function.")) {
            return "function"
        } else if (p.includes("modifier.")) {
            return "modifier"
        } else if (p.includes("contract.")) {
            return "contract"
        } else if (p.includes("sourceUnit")) {
            return "sourceUnit"
        }
    }

    onProcess(sourceUnit) {
        let context = {
            sourceUnit: sourceUnit,
            contract: undefined,
            _function: undefined,
            modifier: undefined
        }


        for (let pat of this.patterns) {

            var patternType = this._getPatternType(pat);
            if (patternType === "sourceUnit") {
                let ret = safeEval(pat, context);
                if (ret) { //allows match & extract (fuzzy)
                    this.solgrep.report(sourceUnit, this, `match-sourceUnit`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : sourceUnit.ast.loc);
                }
                continue; //exit early
            }

            // -- parse pattern --
            // SourceUnit
            Object.values(sourceUnit.contracts).forEach(contract => {

                // update context
                context.contract = contract;

                if (patternType === "contract") {
                    let ret = safeEval(pat, context);
                    if (ret) {
                        this.solgrep.report(sourceUnit, this, `match-contract: ${contract.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : contract.ast.loc);
                    }
                    return;
                }

                // Contract
                contract.functions.forEach(_function => {
                    // Function

                    //update context
                    context._function = _function;

                    if (patternType === "function") {
                        let ret = safeEval(pat, context);
                        if (ret) {
                            this.solgrep.report(sourceUnit, this, `match-function: ${contract.name}.${_function.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : _function.ast.loc);
                        }
                    }
                });

                Object.values(contract.modifiers).forEach(_modifier => {
                    // Modifier
                    //update context
                    context.modifier = _modifier;

                    if (patternType === "modifier") {
                        let ret = safeEval(pat, context);
                        if (ret) {
                            this.solgrep.report(sourceUnit, this, `match-modifier: ${contract.name}.${_modifier.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : _modifier.ast.loc);
                        }
                    }
                });
            });
        }
    }
}
GenericGrep.description = "Scriptable generic semenatic grep. Used in --find=<pattern>";

class Stats extends BaseRule {
    constructor(solgrep) {
        super(solgrep);
        this.stats = {
            sourceUnits: 0,
            contracts: {
                total: 0,
                names: {}
            },
            interfaces: {
                total: 0,
                names: {}
            },
            libraries: {
                total: 0,
                names: {}
            },
        };
    }

    onProcess(sourceUnit) {
        this.stats.sourceUnits += 1;
        Object.values(sourceUnit.contracts).forEach(contract => {
            switch (contract.ast.kind) {
                case "contract":
                case "abstract": /* treat as contract. we cannot distinguish it anyway */
                    this.stats.contracts.total += 1;  //num contracts
                    this.stats.contracts.names[contract.name] = this.stats.contracts.names[contract.name] === undefined ? 1 : this.stats.contracts.names[contract.name] + 1; //num contracts with same name
                    break;
                case "interface":
                    this.stats.interfaces.total += 1;  //num contracts
                    this.stats.interfaces.names[contract.name] = this.stats.interfaces.names[contract.name] === undefined ? 1 : this.stats.interfaces.names[contract.name] + 1; //num contracts with same name
                    break;
                case "library":
                    this.stats.libraries.total += 1;  //num contracts
                    this.stats.libraries.names[contract.name] = this.stats.libraries.names[contract.name] === undefined ? 1 : this.stats.libraries.names[contract.name] + 1; //num contracts with same name
                    break;
                default:
                    throw new Error(`Unknown contract kind: ${contract.ast.kind}`);
            }
        });
    }

    onDirAnalyzed() {
        this.stats.contracts.names = utils.sortObjByValue(this.stats.contracts.names)
        this.stats.libraries.names = utils.sortObjByValue(this.stats.libraries.names)
        this.stats.interfaces.names = utils.sortObjByValue(this.stats.interfaces.names)
        this.solgrep.report(undefined, this, "STATS", this.stats);
    }
    onClose() {
        console.log(this.stats)
        console.log(`TOTAL FILES: ${this.solgrep.totalFiles}`)
        console.log(`ERRORS: ${this.solgrep.errors.length}`)
    }
}
Stats.description = "Prints stats about the analyzed files";

module.exports = {
    BaseRule,
    Stats,
    GenericGrep
}