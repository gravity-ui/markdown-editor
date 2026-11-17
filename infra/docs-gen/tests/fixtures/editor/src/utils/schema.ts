type Schema = {nodes: Record<string, object>; marks: Record<string, object>};

export const nodeTypeFactory = (name: string) => (schema: Schema) => schema.nodes[name];
export const markTypeFactory = (name: string) => (schema: Schema) => schema.marks[name];

export declare function inputRule(regExp: RegExp, type: object): object;
export declare function markInputRule(config: {open: string; close: string}, type: object): object;
export declare class InputRule {
    constructor(regExp: RegExp, type: object);
}
