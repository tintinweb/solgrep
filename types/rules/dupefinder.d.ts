export class DupeFinder extends BaseRule {
    constructor(solgrep: any, selectedModes: any);
    selectedModes: any;
    dupeDb: {};
    onDirAnalyzed(): void;
    onClose(): void;
}
export namespace DupeFinder {
    let description: string;
}
import { BaseRule } from "./builtin";
