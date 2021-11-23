/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const {Stats, GenericGrep} = require('./rules/builtin');
const tincustom = require('./rules/tincustom');
const dupefinder = require('./rules/dupefinder')

module.exports = {
    Stats,
    GenericGrep,
    ...tincustom,
    ...dupefinder
}