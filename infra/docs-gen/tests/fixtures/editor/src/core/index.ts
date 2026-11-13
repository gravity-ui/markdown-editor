export declare class ExtensionBuilder {
    use(extension: (builder: ExtensionBuilder) => void): this;
    addAction(name: string, cb: () => object): this;
    addKeymap(cb: () => Record<string, () => boolean>): this;
    addInputRules(cb: (deps: {schema: Schema}) => {rules: object[]}): this;
    configureMd(cb: (md: MarkdownIt) => MarkdownIt): this;
}

export type Extension = (builder: ExtensionBuilder) => void;
export type ExtensionWithOptions<T> = (builder: ExtensionBuilder, options: T) => void;

type Schema = {nodes: Record<string, object>; marks: Record<string, object>};
type MarkdownIt = {use(plugin: Function, options?: object): MarkdownIt};
