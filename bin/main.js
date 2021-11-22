#!/usr/bin/env node
'use strict'
/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const cliProgress = require('cli-progress');
const chalk = require('chalk');
const {SolGrep, rules} = require('../src/');


const argv = require('yargs') // eslint-disable-line
    .usage('Usage: $0 [options] <folder|...>')
    .nargs([], 1)
    .option('r', {
        alias: 'rule',
        default: [],
        type: 'string',
        describe: 'Enable rules',
        array: true
    })
    .option('l', {
        alias: 'list-rules',
        default: false,
        type: 'boolean',
        describe: 'List available rules',
    })
    .option('f', {
        alias: 'find',
        default: [],
        type: 'string',
        describe: 'Find/Extract information using custom pattern',
        array: true
    })
    .option('o', {
        alias: 'output',
        default: undefined,
        type: 'string',
        describe: 'Write "results" as JSON to output file path.',
    })
    .demandCommand(0)
    .help()
        .alias('h', 'help')
    .version()
        .alias('v', 'version')
    .argv;

var selectedRules = [];
const banner = `🧠 ${chalk.bold("SolGrep")} v${require('../package.json').version} ready!
`;
const byebyeBanner = `

cheers 🙌 
    ${chalk.bold('@tintinweb')} 
    ConsenSys Diligence @ https://consensys.net/diligence/
    https://github.com/tintinweb/solgrep/ 
`

function exitProcess(status) {
    console.log(byebyeBanner)
    process.exit(status);
}

function relPath(path){
    return require('path').relative(process.cwd(),path);
}

/* ---------------  */

async function analyzeDir(sgrep, path){

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    const callbacks = {
        onAnalyzeDir: (numFiles) => {
            progressBar.start(numFiles, 0);
        },
        onAnalyzeFile: (sgrep) => {
            progressBar.increment(1, `Hits: ${sgrep.findings.length}, Errors: ${sgrep.errors.length}`);
        },
        onFileError: (file, err) => {
            console.error(`\n [🔥] ${file}: ${err.message}`)
        }
    }

    var sgrep = new SolGrep('::memory::', selectedRules, callbacks);

    console.log(`\n  📁 ${path}`)

    return sgrep.analyzeDirQueue(path);
}

function main(){
    console.log(banner)

    if(argv.listRules){
        console.log("   Built-in Rules")
        console.log("   ──────────────")
        Object.keys(rules).forEach(ruleName => {
            console.log(`   📝 ${ruleName.padEnd(30)}➝   ${rules[ruleName].description}`)
        })
        exitProcess(0);
    }

    if(argv.find.length){
        selectedRules.push(new rules.GenericGrep(undefined, argv.find));
    }

    argv.rule.forEach(r => {
        let tmpRule = rules[r];
        if(tmpRule){
            selectedRules.push(new tmpRule(undefined));
        } else {
            console.error(` [🔥] Invalid ruleset: ${r}`)
            process.exit(1)
        }
    });

    /* ProgressBar */
    const progressBar =  new cliProgress.SingleBar({
        format: '[{bar}] {percentage}% | 🕙 ETA: {eta}s | {value}/{total} | 🌲 {findings} | 🔥 {errors} | 🗂️  {dir}',
    }, cliProgress.Presets.shades_classic);

    var callbacks = {
        onAnalyzeDir: (targetDir, numFiles, sgrep) => {
            progressBar.start(numFiles, 0, {dir:relPath(targetDir), findings:sgrep.totalFiles, errors:sgrep.errors.length});
        },
        onAnalyzeFile: (file, sgrep) => {
            progressBar.increment(1, {findings:sgrep.totalFindings, errors:sgrep.errors.length});
        },
        onFileError: (file, err) => {
            console.error(`\n [🔥] ${file}: ${err.message}`)
        },
        onDirAnalyzed: (targetDir) => {
            progressBar.stop();
        }
    }

    const sgrep = new SolGrep('::memory::', selectedRules, callbacks);
    let promises = [];

    for(let dir of argv._){
        promises.push(sgrep.analyzeDirQueue(dir))
    }

    //Promise.all(argv._.map(p => sgrep.analyzeDirQueue(p),this)).then(() => {
    Promise.all(promises).then(() => {  
        //multibar.stop()
    
        if(Object.keys(sgrep.findings).length) {
            console.log("")
            console.log("   ────────────────────────────")
            console.log(sgrep.findings)
            console.log("   ────────────────────────────")
        }
        if(argv.output){
            require('fs').writeFileSync(argv.output, JSON.stringify(sgrep.findings, null, 2));
        }

        sgrep.close();
        console.log("   ────────────────────────────")

        exitProcess(sgrep.findings.length);
    })
}

/* ---------------  */
main();