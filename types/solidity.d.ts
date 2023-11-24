import {
  ASTNode,
  SourceUnit as ParserSourceUnit,
} from '@solidity-parser/parser/dist/src/ast-types';
import { Token } from '@solidity-parser/parser/dist/src/types';

export class SourceUnit {
  constructor();
  /**
   * @param {string} fpath - the path to the file
   * @returns {object} - {filePath, content}
   * */
  static getFileContent(fpath: string): { filePath: string; content: string };
  filePath: string;
  ast: ParserSourceUnit & {
    errors?: any[];
    tokens?: Token[];
  };
  content: string;
  contracts: Contract[];
  pragmas: any[];
  imports: any[];
  /**
   * @returns {string} - the source code of the source unit
   */
  getSource(): string;
  /**
   *
   * @returns {Contract[]}
   */
  getContracts(): Contract[];
  /**
   * @returns the AST of the source unit
   * */
  toJSON(): SourceUnit & {
    errors?: any[];
    tokens?: Token[];
  };
  /**
   * @returns {SourceUnit} - a clone of the current SourceUnit
   * */
  clone(): SourceUnit;
  /**
   * @param {string} fpath - the path to the file
   * @returns {SourceUnit} - the source unit
   */
  fromFile(fpath: string): SourceUnit;
  /**
   * @param {string} content
   * */
  fromSource(content: string): void;
  /**
   * @param {string} input - the source code
   * @returns {SourceUnit} - the source unit
   */
  parseAst(input: string): SourceUnit;
}
export class Contract {
  constructor(sourceUnit: any, node: any);
  sourceUnit: any;
  ast: any;
  name: any;
  dependencies: any;
  stateVars: {};
  enums: {};
  structs: {};
  mappings: {};
  modifiers: {};
  functions: any[];
  fallback: any;
  receiveEther: any;
  events: any[];
  inherited_names: {};
  names: {};
  usingFor: {};
  functionCalls: any[];
  /**
   * @returns {FunctionDef[]} - the functions of the contract
   * */
  getFunctions(): FunctionDef[];
  /**
   * @returns - the AST of the contract
   * */
  toJSON(): ASTNode;
  /**
   * @returns {string} - the source code of the contract
   * */
  getSource(): string;
  _processAst(node: any): void;
}

export class Location {
  constructor(line: number, column: number);
  line: number;
  column: number;
}
export class LocationInfo {
  constructor(start: Location, end: Location);
  start: Location;
  end: Location;
}

export class Identifier {
  constructor(type: any, name: any, loc: LocationInfo);
  type: any;
  name: any;
  loc: LocationInfo;
}
export class InitialValue {
  constructor(
    loc: LocationInfo,
    number: number,
    subdenomination: any,
    type: any
  );
  loc: LocationInfo;
  number: number;
  subdenomination: any;
  type:
    | 'NumberLiteral'
    | 'BooleanLiteral'
    | 'StringLiteral'
    | 'Identifier'
    | 'BinaryOperation';
  left?: Identifier;
  right?: Identifier;
  operator?: string; // +, -, *, /, %
}
export class VariableDeclarationStatementVariable {
  constructor(
    expression: any,
    identifier: Identifier,
    type: any,
    isIndexed: boolean,
    isStateVar: boolean,
    loc: LocationInfo,
    storageLocation: any,
    name: string
  );
  expression: any;
  identifier: Identifier;
  type: any;
  isIndexed: boolean;
  isStateVar: boolean;
  loc: LocationInfo;
  storageLocation: any;
  name: string;
}
export class ReturnStatement {
  constructor(expression: any, loc: LocationInfo);
  expression: any;
  loc: LocationInfo;
  type: 'ReturnStatement';
}
export class VariableDeclarationStatement {
  constructor(
    initialValue: InitialValue,
    loc: LocationInfo,
    type: any,
    variables: VariableDeclarationStatementVariable[]
  );
  initialValue: InitialValue;
  loc: LocationInfo;
  type: 'VariableDeclarationStatement';
  variables: VariableDeclarationStatementVariable[];
}
export class FunctionBody {
  constructor(contract: any, node: any);
  loc: LocationInfo;
  statements: (ReturnStatement | VariableDeclarationStatement)[];
}
export class FunctionDef {
  constructor(contract: any, node: any);
  contract: any;
  body: any;
  ast: any;
  name: any;
  modifiers: any;
  /**
   * @returns {string}
   */
  getName(): string;
  /**
   * @returns {string} - the source code of the function
   * */
  getSource(): string;
  /**
   * @param {string} funcName - the name of the function this function may call to
   * @returns {boolean} - true if the function makes a call to funcName
   * */
  callsTo(funcName: string): boolean;
  /**
   * @param {string} funcName - the name of the function this function may call to
   * @param {object} opts - options
   * @param {boolean} opts.findOne - return after first match
   * @returns {object[]} - array of function calls
   * */
  getFunctionCalls(
    funcName: string,
    opts: {
      findOne: boolean;
    }
  ): ASTNode[];
}
