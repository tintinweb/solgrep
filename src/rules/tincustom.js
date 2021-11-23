/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const { BaseRule } = require("./builtin");

class IsInitializable extends BaseRule {
    onProcess(sourceUnit){
        Object.values(sourceUnit.contracts).forEach(contract => {
            //for every contract in the SU
            const found = contract.functions.filter(f => f.name === "initialize" && f.ast.body !== null && (f.ast.visibility === "public" || f.ast.visibility === "external") && !f.ast.modifiers.some(m => m.name === "onlyOwner"));
            
            if(found.length == 0){
                return;
            }

            if(contract.constructor && contract.constructor.callsTo("initialize")){
                //skip autoinit constuctor
                return;
            }


            found.forEach(f => {    
                // is "initialize()" being called from any function in the contract? e.g. constructor
                this.solgrep.report(sourceUnit, this, "INITIALIZEABLE", `${f.name} - public initialize function; likely proxy`,  f.ast.loc);
                
            })
            if(contract.getSource().includes("selfdestruct") || contract.getSource().includes("delegatecall") || contract.getSource().includes("callcode")){
                this.solgrep.report(sourceUnit, this, "INITIALIZEABLE_DANGEROUS", `${contract.name} - public initialize function + dangerous functionality; likely proxy`, sourceUnit.ast.loc);
            }

        })
    }
}
IsInitializable.description = "Checks if a contract is initializable by anyone and not auto-initialized in __constr__";


module.exports = {
    IsInitializable,
    
}