/**
 * @author github.com/tintinweb
 * @license MIT
 * */

const {Stats, GenericGrep} = require('./rules/builtin');
const {IsInitializable} = require('./rules/tincustom');

module.exports = {
    Stats,
    GenericGrep,
    IsInitializable
}