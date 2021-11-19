#!/usr/bin/env node
'use strict'
/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const cliProgress = require('cli-progress');
const {SolGrep} = require('../src/');
const ruleset = require('../src/rules');
const chalk = require('chalk');

const argv = require('yargs') // eslint-disable-line
    .usage('Usage: $0 [options] <folder|...>')
    .nargs([], 1)
    .option('r', {
        alias: 'rules',
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
    .demandCommand(1)
    .help()
        .alias('h', 'help')
    .version()
        .alias('v', 'version')
    .argv;

var rules = [];
const banner = `🧠 ${chalk.bold("SolGrep")} v${require('../package.json').version} starting ...
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

/* ---------------  */
console.log(banner)

if(argv.listRules){
    console.log("   Built-in Rules")
    console.log("   ──────────────")
    Object.keys(ruleset).forEach(ruleName => {
        console.log(`   📝 ${ruleName}`)
    })
    exitProcess(0);
}

if(argv.find.length){
    rules.push(new ruleset.GenericGrep(undefined, argv.find));
}
argv.rules.forEach(r => {
    let tmpRule = ruleset[r];
    if(tmpRule){
        rules.push(tmpRule);
    } else {
        console.error(` [🔥] Invalid ruleset: ${argv.ruleset}`)
        process.exit(1)
    }
});



for(let path of argv._){
    console.log(`\n  📁 ${path}`)

    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    const callbacks = {
        onStart: (numFiles) => {
            bar1.start(numFiles, 0);
        },
        onFile: () => {
            bar1.increment();
        },
        onFileError: (file, err) => {
            console.error(`\n [🔥] ${file}: ${err.message}`)
        }
    }


    let vdb = new SolGrep('::memory::', rules, callbacks);
    vdb.analyzeDir(path);

    console.log("   ──────────────────────────── Results")
    console.log(vdb.results)
    console.log("   ────────────────────────────")

    if(argv.output){
        require('fs').writeFileSync(argv.output, JSON.stringify(vdb.results, null, 2));
    }

    vdb.close();
    console.log("   ────────────────────────────")
    bar1.stop();
}

exitProcess(0);