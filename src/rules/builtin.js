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

class Pattern {
    constructor(p){
        this.TYPES = ["function", "modifier", "contract", "sourceUnit"];
        this.pattern = p;

        this.TYPES.forEach(t => {
            this[t] = p.includes(`${t}.`);
        }, this)


        this.isEmpty = this.TYPES.map((t) => this[t]).every(v => v === false); //static
        this.onlySourceUnit = this.onlyOne("sourceUnit");
        this.onlyContract = this.onlyOne("contract");

    }

    onlyOne(name){
        if(!this.TYPES.includes(name)){
            throw "illegal type";
        }
        const checkOthersUnset = this.TYPES.filter((t) => t !== name).map((t) => this[t]).every( v => v === false);        
        return checkOthersUnset && this[name]; // name==true; others==false;
    }

    oneOf(arr){
        for(let x of arr){
            if(!this.TYPES.includes(x)){
                throw "illegal type"
            }
            if (this[x]) return true;
        }
        return false;
    }
}

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

    onProcess(sourceUnit) {
        let context = {
            sourceUnit: sourceUnit,
            contract: undefined,
            _function: undefined,
            modifier: undefined
        }

        for (let pat of this.patterns) {

            let pattern = new Pattern(pat);
            /* no pattern at all */
            if(pattern.isEmpty) continue; //shortcut: skip invalid pattern

            /* sourceUnit only */
            if (pattern.onlySourceUnit) {
                let ret = safeEval(pattern.pattern, context);
                if (ret) { //allows match & extract (fuzzy)
                    this.solgrep.report(sourceUnit, this, `match-sourceUnit`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : sourceUnit.ast.loc);
                }
                continue; //skip early
            }

            /* sourceUnit & ... */
            Object.values(sourceUnit.contracts).forEach(contract => {
                // update context
                context.contract = contract;
                /* (1) contract only */
                if (pattern.onlyContract) { // if only contract in pattern, match it and return
                    let ret = safeEval(pattern.pattern, context);
                    if (ret) {
                        this.solgrep.report(sourceUnit, this, `match-contract: ${contract.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : contract.ast.loc);
                    }
                    return;
                }
                /* (2) contract & function */
                if(pattern.function){
                    contract.functions.forEach(_function => {
                        // Function
    
                        //update context
                        context._function = _function;
                        let ret = safeEval(pattern.pattern, context);
                        if (ret) {
                            this.solgrep.report(sourceUnit, this, `match-function: ${contract.name}.${_function.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : _function.ast.loc);
                        }
                    });
                }
                /* (3) contract & modifier */
                if(pattern.modifier){
                    Object.values(contract.modifiers).forEach(_modifier => {
                        // Modifier
                        //update context
                        context.modifier = _modifier;
                        let ret = safeEval(pattern.pattern, context);
                        if (ret) {
                            this.solgrep.report(sourceUnit, this, `match-modifier: ${contract.name}.${_modifier.name}`, `${ret}`, typeof ret === 'object' && ret.hasOwnKey('loc') ? ret.loc : _modifier.ast.loc);
                        }
                    });
                }
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