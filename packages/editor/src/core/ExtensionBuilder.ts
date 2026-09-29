import type MarkdownIt from 'markdown-it';
import {inputRules} from 'prosemirror-inputrules';
import {keymap} from 'prosemirror-keymap';
import type {MarkSpec, NodeSpec, Schema} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import type {Logger2} from '../logger';

import type {ActionSpec, ActionStorage} from './types/actions';
import type {Keymap} from './types/keymap';
import type {MarkViewConstructor, NodeViewConstructor} from './types/node-views';
import type {Parser, ParserToken} from './types/parser';
import type {Serializer, SerializerMarkToken, SerializerNodeToken} from './types/serializer';

type InputRulesConfig = Parameters<typeof inputRules>[0];
type ExtensionWithParams = (builder: ExtensionBuilder, ...params: any[]) => void;
type ConfigureMdParams = {
    /**
     * Apply this configurtion to text parser
     * @default true
     */
    text?: boolean;
    /**
     * Apply this configurtion to markup parser
     * @default true
     */
    markup?: boolean;
};

type ConfigureMdCallback = (md: MarkdownIt) => MarkdownIt;
type AddPmPluginCallback = (deps: ExtensionDeps) => Plugin | Plugin[];
type AddPmKeymapCallback = (deps: ExtensionDeps) => Keymap;
type AddPmInputRulesCallback = (deps: ExtensionDeps) => InputRulesConfig;
type AddActionCallback = (deps: ExtensionDeps) => ActionSpec;

enum Priority {
    Highest = 1_000_000,
    VeryHigh = 100_000,
    High = 10_000,
    Medium = 1_000,
    Low = 100,
    VeryLow = 10,
    Lowest = 0,
}

const DEFAULT_PRIORITY = Priority.Medium;

type BuilderContext<T extends object> = {
    has(key: keyof T): boolean;
    get<K extends keyof T>(key: K): T[K] | undefined;
    set<K extends keyof T>(key: K, value: T[K]): BuilderContext<T>;
};

declare global {
    namespace WysiwygEditor {
        interface Context {}
    }
}

export type Extension = (builder: ExtensionBuilder) => void;
export type ExtensionWithOptions<T> = (builder: ExtensionBuilder, options: T) => void;
export type ExtensionAuto<T = void> = T extends void ? Extension : ExtensionWithOptions<T>;

export type NodeViewFactory = (deps: ExtensionDeps) => NodeViewConstructor;
export type MarkViewFactory = (deps: ExtensionDeps) => MarkViewConstructor;

/** @internal */
export type ExtensionSpec = {
    readonly nodeSpecs: ReadonlyMap<string, NodeSpec>;
    readonly markSpecs: ReadonlyMap<string, MarkSpec>;
    readonly parserSpecs: ReadonlyMap<string, ParserToken>;
    readonly nodeSerializers: ReadonlyMap<string, SerializerNodeToken>;
    readonly markSerializers: ReadonlyMap<string, SerializerMarkToken>;
    readonly nodeViews: ReadonlyMap<string, NodeViewFactory>;
    readonly markViews: ReadonlyMap<string, MarkViewFactory>;
    configureMd(md: MarkdownIt, parserType: 'text' | 'markup'): MarkdownIt;
    plugins(deps: ExtensionDeps): Plugin[];
    actions(deps: ExtensionDeps): Record<string, ActionSpec>;
};

export type ExtensionDeps = {
    readonly schema: Schema;
    readonly textParser: Parser;
    readonly markupParser: Parser;
    readonly serializer: Serializer;
    readonly actions: ActionStorage;
};

export class ExtensionBuilder {
    static createContext(): BuilderContext<WysiwygEditor.Context> {
        return new Map();
    }

    /* eslint-disable @typescript-eslint/member-ordering */
    static readonly Priority = Priority;
    readonly Priority = ExtensionBuilder.Priority;
    /* eslint-enable @typescript-eslint/member-ordering */

    readonly #logger: Logger2.ILogger;
    #confMdCbs: {cb: ConfigureMdCallback; params: Required<ConfigureMdParams>}[] = [];
    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];

    #nodeSpecs = new SpecRegistry<NodeSpec>('Node spec');
    #markSpecs = new SpecRegistry<MarkSpec>('Mark spec');
    #parserSpecs = new SpecRegistry<ParserToken>('Parser spec');
    #nodeSerializers = new SpecRegistry<SerializerNodeToken>('Node serializer');
    #markSerializers = new SpecRegistry<SerializerMarkToken>('Mark serializer');
    #nodeViews = new Map<string, NodeViewFactory>();
    #markViews = new Map<string, MarkViewFactory>();

    readonly context: BuilderContext<WysiwygEditor.Context>;

    constructor(logger: Logger2.ILogger, context?: BuilderContext<WysiwygEditor.Context>) {
        this.#logger = logger;
        this.context = context ?? ExtensionBuilder.createContext();
    }

    get logger(): Logger2.ILogger {
        return this.#logger;
    }

    use(extension: Extension): this;
    use<T>(extension: ExtensionWithOptions<T>, options: T): this;
    use(extension: ExtensionWithParams, ...params: any[]): this {
        extension(this, ...params);
        return this;
    }

    configureMd(cb: ConfigureMdCallback, params: ConfigureMdParams = {}): this {
        this.#confMdCbs.push({
            cb,
            params: {
                text: params.text ?? true,
                markup: params.markup ?? true,
            },
        });
        return this;
    }

    hasNodeSpec(name: string): boolean {
        return this.#nodeSpecs.has(name);
    }

    hasMarkSpec(name: string): boolean {
        return this.#markSpecs.has(name);
    }

    addPlugin(cb: AddPmPluginCallback, priority = DEFAULT_PRIORITY): this {
        this.#plugins.push({cb, priority});
        return this;
    }

    addKeymap(cb: AddPmKeymapCallback, priority = DEFAULT_PRIORITY): this {
        this.#plugins.push({cb: (...args) => keymap(cb(...args)), priority});
        return this;
    }

    addInputRules(cb: AddPmInputRulesCallback, priority = DEFAULT_PRIORITY): this {
        this.#plugins.push({cb: (...args) => inputRules(cb(...args)), priority});
        return this;
    }

    addAction(name: string, cb: AddActionCallback): this {
        if (this.#actions.some(([actionName]) => actionName === name)) {
            throw new Error(
                `[Markdown Wysiwyg Editor] action with this name "${name}" already exist`,
            );
        }
        this.#actions.push([name, cb]);
        return this;
    }

    addNodeSpec(name: string, cb: () => NodeSpec): this {
        this.#nodeSpecs.add(name, cb);
        return this;
    }

    addMarkSpec(name: string, cb: () => MarkSpec, priority = DEFAULT_PRIORITY): this {
        this.#markSpecs.add(name, cb, priority);
        return this;
    }

    /** Adds a node view factory. The factory runs after the dependencies are built. */
    addNodeView(name: string, cb: NodeViewFactory): this {
        if (this.#nodeViews.has(name)) {
            throw new Error(`Node view for "${name}" is already registered`);
        }
        this.#nodeViews.set(name, cb);
        return this;
    }

    /** Adds a mark view factory. The factory runs after the dependencies are built. */
    addMarkView(name: string, cb: MarkViewFactory): this {
        if (this.#markViews.has(name)) {
            throw new Error(`Mark view for "${name}" is already registered`);
        }
        this.#markViews.set(name, cb);
        return this;
    }

    addMarkdownTokenParserSpec(tokenName: string, cb: () => ParserToken): this {
        this.#parserSpecs.add(tokenName, cb);
        return this;
    }

    addNodeSerializerSpec(name: string, cb: () => SerializerNodeToken): this {
        this.#nodeSerializers.add(name, cb);
        return this;
    }

    addMarkSerializerSpec(name: string, cb: () => SerializerMarkToken): this {
        this.#markSerializers.add(name, cb);
        return this;
    }

    overrideNodeSpec(name: string, cb: (prev: NodeSpec) => NodeSpec): this {
        this.#nodeSpecs.override(name, cb);
        return this;
    }

    overrideMarkSpec(name: string, cb: (prev: MarkSpec) => MarkSpec): this {
        this.#markSpecs.override(name, cb);
        return this;
    }

    overrideMarkdownTokenParserSpec(
        tokenName: string,
        cb: (prev: ParserToken) => ParserToken,
    ): this {
        this.#parserSpecs.override(tokenName, cb);
        return this;
    }

    overrideNodeSerializerSpec(
        name: string,
        cb: (prev: SerializerNodeToken) => SerializerNodeToken,
    ): this {
        this.#nodeSerializers.override(name, cb);
        return this;
    }

    overrideMarkSerializerSpec(
        name: string,
        cb: (prev: SerializerMarkToken) => SerializerMarkToken,
    ): this {
        this.#markSerializers.override(name, cb);
        return this;
    }

    /** @internal */
    build(): ExtensionSpec {
        const confMd = this.#confMdCbs.slice();
        const plugins = this.#plugins.slice();
        const actions = this.#actions.slice();

        return {
            nodeSpecs: this.#nodeSpecs.resolve(),
            markSpecs: this.#markSpecs.resolve(true),
            parserSpecs: this.#parserSpecs.resolve(),
            nodeSerializers: this.#nodeSerializers.resolve(),
            markSerializers: this.#markSerializers.resolve(),
            nodeViews: new Map(this.#nodeViews),
            markViews: new Map(this.#markViews),
            configureMd: (md, parserType) =>
                confMd.reduce((pMd, {cb, params}) => {
                    if (parserType === 'text' && params.text) {
                        return cb(pMd);
                    }
                    if (parserType === 'markup' && params.markup) {
                        return cb(pMd);
                    }
                    return pMd;
                }, md),
            plugins: (deps) => {
                return plugins
                    .sort((a, b) => b.priority - a.priority)
                    .reduce<Plugin[]>((acc, {cb}) => {
                        const res = cb(deps);
                        if (Array.isArray(res)) acc.push(...res);
                        else acc.push(res);
                        return acc;
                    }, []);
            },
            actions: (deps) =>
                actions.reduce(
                    (obj, [name, cb]) => {
                        obj[name] = cb(deps);
                        return obj;
                    },
                    {} as Record<string, ActionSpec>,
                ),
        };
    }
}

type SpecOperation<T> =
    | {type: 'add'; name: string; cb: () => T}
    | {type: 'override'; name: string; cb: (prev: T) => T};

class SpecRegistry<T> {
    readonly #label: string;
    readonly #priorities = new Map<string, number>();
    readonly #pipeline: SpecOperation<T>[] = [];

    constructor(label: string) {
        this.#label = label;
    }

    has(name: string): boolean {
        return this.#priorities.has(name);
    }

    add(name: string, cb: () => T, priority = 0): void {
        if (this.has(name)) {
            throw new Error(`${this.#label} "${name}" is already registered`);
        }
        this.#priorities.set(name, priority);
        this.#pipeline.push({type: 'add', name, cb});
    }

    override(name: string, cb: (prev: T) => T): void {
        if (!this.has(name)) {
            throw new Error(
                `Cannot override ${this.#label.toLowerCase()} "${name}": not registered`,
            );
        }
        this.#pipeline.push({type: 'override', name, cb});
    }

    resolve(sortByPriority = false): ReadonlyMap<string, T> {
        const specs = new Map<string, T>();
        for (const entry of this.#pipeline) {
            specs.set(
                entry.name,
                entry.type === 'add' ? entry.cb() : entry.cb(specs.get(entry.name)!),
            );
        }
        if (sortByPriority) {
            return new Map(
                [...specs].sort(([a], [b]) => this.#priorities.get(b)! - this.#priorities.get(a)!),
            );
        }
        return specs;
    }
}
