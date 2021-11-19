/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const utils = require('./utils');
const safeEval = require('safe-eval');

class BaseRule {
    constructor(solgrep){
        this.solgrep = solgrep;
    }

    check(sourceUnit){
        throw new Error("Not implemented");
    }
}

class IsInitializable extends BaseRule{
    check(sourceUnit){
        Object.values(sourceUnit.contracts).forEach(contract => {
            //for every contract in the SU
            const found = contract.functions.filter(f => f.name === "initialize" && f.ast.body !== null && (f.ast.visibility === "public" || f.ast.visibility === "external") && !f.ast.modifiers.some(m => m.name === "onlyOwner"));
            
            if(found.length == 0){
                return;
            }

            if(contract.constructor && contract.constructor.hasFunctionCall("initialize")){
                //skip autoinit constuctor
                return;
            }


            found.forEach(f => {    
                // is "initialize()" being called from any function in the contract? e.g. constructor
                this.solgrep.report(sourceUnit, this, "INITIALIZEABLE", `${f.name} - public initialize function; likely proxy`);
                
            })
            if(contract.getSource().includes("selfdestruct") || contract.getSource().includes("delegatecall") || contract.getSource().includes("callcode")){
                this.solgrep.report(sourceUnit, this, "INITIALIZEABLE_DANGEROUS", `${contract.name} - public initialize function + dangerous functionality; likely proxy`);
            }

        })
    }
}

class IsMultipleBalanceOfSameFunc extends BaseRule{
    check(sourceUnit){
        Object.values(sourceUnit.contracts).forEach(contract => {
            //for every contract in the SU
            contract.functions.forEach(f => {
                if(f.ast.modifiers.includes("nonReentrant")) return; //ignore nonReentrant
                const funcbody = f.getSource();
                if( (funcbody.split('.balanceOf').length -1 >= 2) && funcbody.split('diff').length -1 >= 2){
                    this.solgrep.report(sourceUnit, this, "DBL_BALANCEOF", `${f.name} - balanceOf() called multiple times within same func`);
                }
            })
        })
    }
}

class GenericGrep extends BaseRule {
    constructor(solgrep, patterns){
        super(solgrep);
        this.patterns = this._normalizePatterns(patterns);
    }

    _normalizePatterns(pat){
        const remapFunction = /function\./ig;

        return pat.map(p => {
            if(p.includes("{") || p.includes("}") || p.includes("function ") || p.includes("class ") || p.includes("this.") || p.includes("async")|| p.includes("require") || p.includes("\n")){
                throw new Error("Invalid pattern: " + p);
            }
            return p.replaceAll(remapFunction, '_function.')

        }).filter(p => p.length > 0);
    }

    _getPatternType(p){
        if(p.includes("function.")){
            return "function"
        } else if(p.includes("contract.")){
            return "contract"
        } else if (p.includes("sourceUnit")){
            return "sourceUnit"
        }
    }

    check(sourceUnit){
        let context = {
            sourceUnit: sourceUnit,
            contract: undefined,
            function: undefined
        }

        for (let pat of this.patterns) {
            
            let patternType = this._getPatternType(pat);
            if(patternType === "sourceUnit"){
                let ret = safeEval(pat, context);
                if(ret){ //allows match & extract (fuzzy)
                    this.solgrep.report(sourceUnit, this, `match-sourceUnit`, `${ret}`);
                }
                continue; //exit early
            }

            // -- parse pattern --
            // SourceUnit
            Object.values(sourceUnit.contracts).forEach(contract => {

                // update context
                context.contract = contract;

                if(patternType === "contract"){
                    let ret = safeEval(pat, context);
                    if(ret){
                        this.solgrep.report(sourceUnit, this, `match-contract: ${contract.name}`, `${ret}`);
                    }
                    return;
                }
                
                // Contract
                contract.functions.forEach(_function => {
                    // Function
                    
                    //update context
                    context._function = _function;

                    if(patternType === "function"){
                        let ret = safeEval(pat, context);
                        if(ret){
                            this.solgrep.report(sourceUnit, this, `match-function: ${contract.name}.${_function.name}`, `${ret}`);
                        }
                    }
                });
            });
        }
    }
}



class Stats extends BaseRule {
    constructor(solgrep){
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
            abstract: {
                total: 0,
                names: {}
            }
        };
    }

    check(sourceUnit){  
        this.stats.sourceUnits += 1;
        Object.values(sourceUnit.contracts).forEach(contract => {
            switch(contract.ast.kind){
                case "contract": 
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
                case "abstract":
                    this.stats.abstract.total += 1;  //num contracts
                    this.stats.abstract.names[contract.name] = this.stats.abstract.names[contract.name] === undefined ? 1 : this.stats.abstract.names[contract.name] + 1; //num contracts with same name
                    break;
                default:
                    throw new Error(`Unknown contract kind: ${contract.ast.kind}`);
            }
        });
    }

    onEnd(){
        this.stats.contracts.names = utils.sortObjByValue(this.stats.contracts.names)
        this.stats.libraries.names = utils.sortObjByValue(this.stats.libraries.names)
        this.stats.interfaces.names = utils.sortObjByValue(this.stats.interfaces.names)
        this.stats.abstract.names = utils.sortObjByValue(this.stats.abstract.names)
        this.solgrep.report(undefined, this, "STATS", this.stats);
    } 
    onExit(){
        console.log(this.stats)
        console.log(`TOTAL FILES: ${this.solgrep.totalFiles}`)
        console.log(`ERRORS: ${this.solgrep.errors.length}`)
    }
}


module.exports = {
    IsInitializable,
    IsMultipleBalanceOfSameFunc,
    Stats,
    GenericGrep
}