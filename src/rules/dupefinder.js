/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const { BaseRule } = require("./builtin");
const utils = require('../utils');
const {AstHashedContractSync, HASH_MODES} = require("solidity-doppelganger");

//["AST_EXACT", "AST_STRUCTURE"];

class DupeFinder extends BaseRule {
    constructor(solgrep, selectedModes) {
        super(solgrep);
        this.selectedModes = selectedModes || HASH_MODES;
        this.dupeDb = {}; // {hash: [file, file, ...]}
        this.selectedModes.forEach(mode => this.dupeDb[mode] = {});
    }

    onProcess(sourceUnit) {
        Object.values(sourceUnit.contracts).forEach(contract => {
            HASH_MODES.forEach(mode => {
                let hashAst = new AstHashedContractSync({mode:mode}, sourceUnit.filePath).fromAst(contract.ast)
                if(!this.dupeDb[mode][hashAst.hash] || !Array.isArray(this.dupeDb[mode][hashAst.hash])){
                    this.dupeDb[mode][hashAst.hash] = [];
                }
                this.dupeDb[mode][hashAst.hash].push(`${sourceUnit.filePath}::${contract.name}`)
            })
            
        });
    }

    onDirAnalyzed() {
        this.solgrep.report(undefined, this, "DUPES", this.dupeDb);
    }
    onClose() {
        var uniqueContracts = {};
        var totalContracts = {}
        
        this.selectedModes.forEach(mode => {
            if(typeof uniqueContracts[mode] === "undefined"){
                uniqueContracts[mode] = 0;
                totalContracts[mode] = 0;
            }
            totalContracts[mode] += Object.values(this.dupeDb[mode]).reduce((acc,curr) => acc + curr.length, 0); //number of contracts with unique hashes
            uniqueContracts[mode] += Object.values(this.dupeDb[mode]).filter(v => v.length == 1).length; //number of contracts with unique hashes
            this.dupeDb[mode] = utils.filterObjByValue(utils.sortObjByArrayLength(this.dupeDb[mode]), (v) => v.length > 1);
        })
        console.log("")
        console.log("ℹ️  Duplicate Contracts (Hash => SourceUnits):")
        console.log(this.dupeDb)
        console.log("")
        console.log("ℹ️  Number of duplicate Contracts per matching method:")
        this.selectedModes.forEach(mode => {
            console.log(`   → ${mode}: ${(totalContracts[mode]-uniqueContracts[mode])}/${totalContracts[mode]}  (${100*(totalContracts[mode]-uniqueContracts[mode])/totalContracts[mode]} % duplicates)`)
        })
        
    }
}
DupeFinder.description = "Find Duplicate Contracts! Either 'similar' (AST fuzzy matching) or exact (AST structure) matches.";

module.exports = {
    DupeFinder
}