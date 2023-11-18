import { SourceUnit } from "../solidity";

export class BaseRule {
    constructor(solgrep: any);
    solgrep: any;
    onProcess(sourceUnit: any): void;
}
export namespace BaseRule {
    let description: string;
}
export class Stats extends BaseRule {
    stats: {
        sourceUnits: number;
        contracts: {
            total: number;
            names: {};
        };
        interfaces: {
            total: number;
            names: {};
        };
        libraries: {
            total: number;
            names: {};
        };
    };
    onDirAnalyzed(): void;
    onClose(): void;
}
export namespace Stats {
    let description_1: string;
    export { description_1 as description };
}
export class GenericGrep extends BaseRule {
    constructor(solgrep: any, patterns: any);
    patterns: any;
    _normalizePatterns(pat: any): any;
    /**
     * @param {SourceUnit} sourceUnit - sourceUnit to process
     * */
    onProcess(sourceUnit: SourceUnit): void;
}
export namespace GenericGrep {
    let description_2: string;
    export { description_2 as description };
}
