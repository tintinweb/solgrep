'use strict'
/**
 * @author github.com/tintinweb
 * @license MIT
 * */
/** IMPORT */

const utils = require('./utils');
const {SourceUnit} = require('./solidity');
const ruleset = require('./rules');


class SolGrep {
    constructor(solgrep_path, rules, callbacks) {
        this.solgrep_path = solgrep_path
        this.results = {};
        // override rule ref to solgrep for external rules
        if (rules.length){
            this.rules = rules.map(r => {r.solgrep = this; return r});
            
        } else {
            this.rules = [
                new ruleset.IsInitializable(this),
                new ruleset.IsMultipleBalanceOfSameFunc(this),
                new ruleset.Stats(this)
            ]
        }
        
        this.errors = []
        this.totalFiles = 0

        this.callbacks = callbacks || {};
    }

    close(){
        this.callbacks.onClose && this.callbacks.onClose(this.rules);
        this.rules.forEach(rule => rule.onExit && rule.onExit());
    }

    report(sourceUnit, rule, tag, info){
        this.callbacks.onReport && this.callbacks.onReport(sourceUnit, rule, tag, info);
        let key = sourceUnit ? sourceUnit.filePath : "__general__"
        let result = this.results[key] === undefined ? this.results[key] = [] : this.results[key];
        result.push({rule:rule.constructor.name, tag:tag, info:info})
    }

    async analyzeFile(file){
        this.callbacks.onFile && this.callbacks.onFile(file);
        try {
            this.totalFiles += 1;
            const su = new SourceUnit().fromFile(file);

            this.rules.forEach(rule => rule.check(su))
            this.callbacks.onFileOk && this.callbacks.onFileOk(file);
        } catch(e){
            this.errors.push([file, e])
            this.callbacks.onFileError && this.callbacks.onFileError(file, e);
        }
    }

    analyzeDir(targetDir) {
        const files = utils.getAllDirFiles(targetDir, (f) => f.endsWith('.sol'));
        const numFiles = files.length;
        this.callbacks.onStart && this.callbacks.onStart(numFiles);
        let ret = Promise.all(files.map(async (file) => this.analyzeFile(file)));
        this.callbacks.onEnd && this.callbacks.onEnd();
        this.rules.forEach(rule => rule.onEnd && rule.onEnd());
        return ret;
    }
}

module.exports = {
    SolGrep
}