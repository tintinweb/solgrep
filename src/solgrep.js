'use strict'
/**
 * @author github.com/tintinweb
 * @license MIT
 * */
/** IMPORT */

const utils = require('./utils');
const {SourceUnit} = require('./solidity');
const ruleset = require('./rules');
const fastq = require('fastq');


class SolGrep {
    constructor(solgrep_path, rules, callbacks) {
        this.solgrep_path = solgrep_path
        this.findings = {};
        // override rule ref to solgrep for external rules
        if (rules.length){
            this.rules = rules.map(r => {r.solgrep = this; return r});
            
        } else {
            this.rules = [
                new ruleset.Stats(this)
            ]
        }
        
        this.errors = []
        this.totalFindings = 0
        this.totalFiles = 0

        this.callbacks = callbacks || {};
    }

    notify(name, ...args){
        this.callbacks.hasOwnProperty(name) && this.callbacks[name](...args);
    }

    notifyRules(name, ...args){
        for(let rule of this.rules){
            if(!(name in rule)) continue;
            rule[name](...args);
        }
    }

    close(){
        this.notify("onClose", this.rules)
        this.notifyRules("onClose")
    }

    report(sourceUnit, rule, tag, info, loc){
        this.notify("onReport", sourceUnit, rule, tag, info, loc);
        let key = sourceUnit ? sourceUnit.filePath : "__general__"
        let result = this.findings[key] === undefined ? this.findings[key] = [] : this.findings[key];
        result.push({rule:rule.constructor.name, tag:tag, info:info, loc: typeof loc === 'object' ? [loc.start.line, loc.start.column, loc.end.line, loc.end.column] : null})
        this.totalFindings += 1;
    }

    async analyzeFile(file){
        this.notify("onAnalyzeFile", file, this);
        try {
            this.totalFiles += 1;
            const su = new SourceUnit().fromFile(file);
            await this.notifyRules("onProcess", su); /* process rules! */

            this.notify("onFileProcessed", file);
        } catch(e){
            this.errors.push([file, e])
            this.notify("onFileError", file, e);
        }
    }

    analyzeDir(targetDir){
        return new Promise((resolve, reject) => {
            const files = utils.getAllDirFiles(targetDir, (f) => f.endsWith('.sol'));  //sync:
            const numFiles = files.length;

            this.notify("onAnalyzeDir", targetDir, numFiles, this);
            
            /* block until all files finished */
            Promise.all(files.map((file) => this.analyzeFile(file)));

            this.notify("onDirAnalyzed", targetDir);
            this.notifyRules("onDirAnalyzed")
            resolve(this.findings);
        })
    }
    
    analyzeDirQueue(targetDir) {

        return new Promise((resolve, reject) => {
            const files = utils.getAllDirFiles(targetDir, (f) => f.endsWith('.sol'));  //sync:
            const numFiles = files.length;

            this.notify("onAnalyzeDir", targetDir, numFiles, this);
            if(numFiles == 0){
                return resolve([]);
            }

            const q = fastq(this, worker);
            q.drain = () => {
                this.notify("onDirAnalyzed", targetDir);
                this.notifyRules("onDirAnalyzed")
                return resolve(this.findings);
            };

            async function worker (arg, done) {
                let ret = await this.analyzeFile(arg)
                done && done(null, ret)
                return ret;
            }
            
            // optimized: fast-push "analyzeFile(file)" tasks
            var i = 0, len = files.length;
            while (i < len) {
                q.push(files[i++]);
            }

        }); 
    }
}

module.exports = {
    SolGrep
}