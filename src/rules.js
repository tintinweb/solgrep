/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const {Stats, GenericGrep} = require('./rules/builtin');
const tincustom = require('./rules/tincustom');

module.exports = {
    Stats,
    GenericGrep,
    ...tincustom
}