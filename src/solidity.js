'use strict'
/**
 * @author github.com/tintinweb
 * @license MIT
 * */
/** IMPORT */

const fs = require('fs');
const path = require('path');
const parser = require('@solidity-parser/parser');


class FindOneExit extends Error {}

const prxAttribForwarder = {
    get: function (target, prop, receiver) {
        return target[prop] === undefined ? target.ast[prop] : target[prop];
    }
}

class SourceUnit {
    constructor() {
        this.filePath = undefined;
        this.ast = undefined;
        this.content = undefined;
        this.contracts = {};
        this.pragmas = [];
        this.imports = [];
    }

    getSource() {
        return this.content;
    }

    static getFileContent(fpath) {
        if (!fs.existsSync(fpath)) {
            throw Error(`File '${fpath}' does not exist.`);
        }
        const filePath = path.resolve(fpath);
        const content = fs.readFileSync(filePath, "utf-8");
        return { filePath, content };
    }

    toJSON() {
        return this.ast;
    }

    clone() {
        return Object.assign(new SourceUnit(this.workspace), this);
    }

    fromFile(fpath) {
        const { filePath, content } = SourceUnit.getFileContent(fpath);  // returns {fpath, content}
        this.filePath = filePath;
        this.fromSource(content);
        return this;
    }

    fromSource(content) {
        /** parser magic */
        this.content = content;
        this.parseAst(content);
    }

    parseAst(input) {
        this.ast = parser.parse(input, { loc: true, tolerant: true });

        if (typeof this.ast === "undefined") {
            throw new parser.ParserError("Parser failed to parse file.");
        }

        /** AST rdy */

        var this_sourceUnit = this;

        parser.visit(this.ast, {
            PragmaDirective(node) { this_sourceUnit.pragmas.push(node); },
            ImportDirective(node) { this_sourceUnit.imports.push(node); },
            ContractDefinition(node) {
                this_sourceUnit.contracts[node.name] = new Proxy(new Contract(this_sourceUnit, node), prxAttribForwarder);
            },
        });
        /*** also import dependencies? */
        return this;
    }
}

class Contract {
    constructor(sourceUnit, node) {
        this.sourceUnit = sourceUnit;
        this.ast = node;
        this.name = node.name;
        this.dependencies = node.baseContracts.map(spec => spec.baseName.namePath);

        this.stateVars = {};  // pure statevars --> see names
        this.enums = {};  // enum declarations
        this.structs = {}; // struct declarations
        this.mappings = {};  // mapping declarations
        this.modifiers = {};  // modifier declarations
        this.functions = [];  // function and method declarations; can be overloaded
        this.constructor = null;  // ...
        this.fallback = null;  // ...
        this.receiveEther = null; // ...
        this.events = [];  // event declarations; can be overloaded
        this.inherited_names = {};  // all names inherited from other contracts
        this.names = {};   // all names in current contract (methods, events, structs, ...)
        this.usingFor = {}; // using XX for YY

        this.functionCalls = [];

        this._processAst(node);
    }

    toJSON() {
        return this.ast;
    }

    getSource() {
        return this.sourceUnit.content.split("\n").slice(this.ast.loc.start.line - 1, this.ast.loc.end.line).join("\n");
    }

    _processAst(node) {

        var current_function = null;
        let current_contract = this;

        parser.visit(node, {

            StateVariableDeclaration(_node) {
                parser.visit(_node, {
                    VariableDeclaration(__node) {
                        __node.extra = { usedAt: [] };
                        current_contract.stateVars[__node.name] = __node;
                        current_contract.names[__node.name] = __node;
                    }
                });
            },
            // --> is a subtype. Mapping(_node){current_contract.mappings[_node.name]=_node},
            Mapping(_node) {
                current_contract.mappings[_node.name] = _node;
            },
            EnumDefinition(_node) {
                current_contract.enums[_node.name] = _node;
                current_contract.names[_node.name] = _node;
            },
            StructDefinition(_node) {
                current_contract.structs[_node.name] = _node;
                current_contract.names[_node.name] = _node;
            },
            UsingForDeclaration(_node) {
                current_contract.usingFor[_node.libraryName] = _node;
            },
            ConstructorDefinition(_node) {
                current_contract.constructor = _node;
                current_contract.names[_node.name] = _node;
            }, // wrong def in code: https://github.com/solidityj/solidity-antlr4/blob/fbe865f8ba510cbdb1540fcf9517a42820a4d097/Solidity.g4#L78 for consttuctzor () ..
            ModifierDefinition(_node) {
                current_function = new FunctionDef(current_contract, _node, "modifier");
                current_contract.modifiers[_node.name] = current_function;
                current_contract.names[_node.name] = current_function;
            },
            EventDefinition(_node) {
                current_function = {
                    _node: _node,
                    name: _node.name,
                    arguments: {},  // declarations: quick access to argument list
                    declarations: {},  // all declarations: arguments+returns+body
                };
                current_contract.events.push(current_function);

                current_contract.names[_node.name] = current_function;
                // parse function body to get all function scope params.
                // first get declarations
                parser.visit(_node.parameters, {
                    VariableDeclaration: function (__node) {
                        current_function.arguments[__node.name] = __node;
                        current_function.declarations[__node.name] = __node;
                    }
                });

            },
            FunctionDefinition(_node) {
                let newFunc = new Proxy(new FunctionDef(current_contract, _node), prxAttribForwarder);
                current_contract.functions.push(newFunc);
                current_contract.names[_node.name] = newFunc;
            },

            FunctionCall(__node) {
                current_contract.functionCalls.push(__node);
            },
        });
    }
}

class FunctionDef {
    constructor(contract, node) {
        this.contract = contract;
        this.ast = node;

        if (this.ast.isConstructor) {
            contract.constructor = this;
            this.name = "__constructor__"
        } else if (this.ast.isFallback) {
            contract.fallback = this;
            this.name = "__fallback__"
        } else if (this.ast.isReceiveEther) {
            contract.receiveEther = this;
            this.name = "__receiveEther__"
        } else {
            this.name = node.name;
        }

        if (this.ast.isConstructor || !this.ast.modifiers || !this.ast.modifiers.length) {
            this.modifiers = {}
        } else {

            this.modifiers = this.ast.modifiers.reduce((a, v) => ({ ...a, [v.name]: v }), {})
        }
    }

    getSource() {
        return this.contract.sourceUnit.content.split("\n").slice(this.ast.loc.start.line - 1, this.ast.loc.end.line).join("\n");
    }

    callsTo(funcName) {
        return !!this.getFunctionCalls(funcName, { findOne: true }).length;
    }

    getFunctionCalls(funcName, opts) {
        let found = [];
        opts = opts || {};
        try {

            parser.visit(this.ast, {
                FunctionCall(node) {
                    switch (node.expression.type) {
                        case "MemberAccess":
                            if (node.expression.memberName === funcName) {
                                found.push(node);
                            }
                            break;
                        case "Identifier":
                            if (node.expression.name === funcName) {
                                found.push(node);
                            }
                            break;
                        case "TypeNameExpression":
                            if (node.expression.typeName === funcName) {
                                found.push(node);
                            }
                    }
                    if (opts.findOne && found.length) {
                        throw new FindOneExit(); // abort parser
                    }
                }
            });

        } catch (e) {
            if (e instanceof FindOneExit) {
                return found;
            }
            throw e;
        }


        return found;
    }

}

module.exports = {
    SourceUnit,
    Contract
}