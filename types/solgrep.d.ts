export class SolGrep {
    constructor(solgrep_path: any, rules: any, callbacks: any);
    solgrep_path: any;
    findings: {};
    rules: any;
    errors: any[];
    totalFindings: number;
    totalFiles: number;
    callbacks: any;
    notify(name: any, ...args: any[]): void;
    notifyRules(name: any, ...args: any[]): void;
    close(): void;
    report(sourceUnit: any, rule: any, tag: any, info: any, loc: any): void;
    analyzeFile(file: any): Promise<void>;
    analyzeDir(targetDir: any): Promise<any>;
    analyzeDirQueue(targetDir: any): Promise<any>;
}
