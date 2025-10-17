import type MarkdownIt from 'markdown-it';
import OrderedMap from 'orderedmap'; // eslint-disable-line import/no-extraneous-dependencies
import {inputRules} from 'prosemirror-inputrules';
import {keymap} from 'prosemirror-keymap';
import type {MarkSpec, NodeSpec} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import type {Logger2} from '../logger';

import type {ActionSpec} from './types/actions';
import type {
    Extension,
    ExtensionDeps,
    ExtensionMarkSpec,
    ExtensionNodeSpec,
    ExtensionSpec,
    ExtensionWithOptions,
} from './types/extension';
import type {Keymap} from './types/keymap';
import type {MarkViewConstructor, NodeViewConstructor} from './types/node-views';
import type {ParserToken} from './types/parser';
import type {SerializerMarkToken, SerializerNodeToken} from './types/serializer';

type InputRulesConfig = Parameters<typeof inputRules>[0];
type ExtensionWithParams = (builder: ExtensionBuilder, ...params: any[]) => void;
type ConfigureMdParams = {
    /**
     * Apply this configurtion to text parser
     *
     * @default true
     */
    text?: boolean;
    /**
     * Apply this configurtion to markup parser
     *
     * @default true
     */
    markup?: boolean;
};

type ConfigureMdCallback = (md: MarkdownIt) => MarkdownIt;
type AddPmNodeCallback = () => ExtensionNodeSpec;
type AddPmMarkCallback = () => ExtensionMarkSpec;
type AddPmPluginCallback = (deps: ExtensionDeps) => Plugin | Plugin[];
type AddPmKeymapCallback = (deps: ExtensionDeps) => Keymap;
type AddPmInputRulesCallback = (deps: ExtensionDeps) => InputRulesConfig;
type AddActionCallback = (deps: ExtensionDeps) => ActionSpec;

// New callback types for the separate methods
type AddNodeSpecCallback = () => NodeSpec;
type AddMarkSpecCallback = () => MarkSpec;
type AddParserSpecCallback = () => {
    nodeType?: string;
    markType?: string;
    tokenName?: string;
    tokenSpec: ParserToken;
};
type AddNodeSerializerSpecCallback = () => SerializerNodeToken;
type AddMarkSerializerSpecCallback = () => SerializerMarkToken;
type AddNodeViewCallback = (deps: ExtensionDeps) => NodeViewConstructor;
type AddMarkViewCallback = (deps: ExtensionDeps) => MarkViewConstructor;

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
    #nodeSpecs: Record<string, {name: string; cb: AddPmNodeCallback}> = {};
    #markSpecs: Record<string, {name: string; cb: AddPmMarkCallback; priority: number}> = {};
    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];

    // New data structures for the separate methods
    #nodeSpecEntries: Record<string, {name: string; specCb: AddNodeSpecCallback}> = {};
    #markSpecEntries: Record<
        string,
        {name: string; specCb: AddMarkSpecCallback; priority: number}
    > = {};
    #parserSpecEntries: {cb: AddParserSpecCallback}[] = [];
    #nodeSerializerSpecEntries: Record<string, {name: string; cb: AddNodeSerializerSpecCallback}> =
        {};
    #markSerializerSpecEntries: Record<string, {name: string; cb: AddMarkSerializerSpecCallback}> =
        {};
    #nodeViewEntries: Record<string, {name: string; cb: AddNodeViewCallback}> = {};
    #markViewEntries: Record<string, {name: string; cb: AddMarkViewCallback}> = {};

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

    /**
     * @deprecated Use addNodeSpec, addParserSpec, addNodeSerializerSpec, addNodeView instead
     */
    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        this.#nodeSpecs[name] = {name, cb};
        return this;
    }

    /**
     * @deprecated Use addMarkSpec, addParserSpec, addMarkSerializerSpec, addMarkView instead
     */
    addMark(name: string, cb: AddPmMarkCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        this.#markSpecs[name] = {name, cb, priority};
        return this;
    }

    addNodeSpec(name: string, cb: AddNodeSpecCallback): this {
        if (this.#nodeSpecEntries[name]) {
            throw new Error(`ProseMirror node spec with this name "${name}" already exist`);
        }
        this.#nodeSpecEntries[name] = {name, specCb: cb};
        return this;
    }

    addMarkSpec(name: string, cb: AddMarkSpecCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecEntries[name]) {
            throw new Error(`ProseMirror mark spec with this name "${name}" already exist`);
        }
        this.#markSpecEntries[name] = {name, specCb: cb, priority};
        return this;
    }

    addParserSpec(cb: AddParserSpecCallback): this {
        this.#parserSpecEntries.push({cb});
        return this;
    }

    addNodeSerializerSpec(name: string, cb: AddNodeSerializerSpecCallback): this {
        if (this.#nodeSerializerSpecEntries[name]) {
            throw new Error(`Node serializer spec with this name "${name}" already exist`);
        }
        this.#nodeSerializerSpecEntries[name] = {name, cb};
        return this;
    }

    addMarkSerializerSpec(name: string, cb: AddMarkSerializerSpecCallback): this {
        if (this.#markSerializerSpecEntries[name]) {
            throw new Error(`Mark serializer spec with this name "${name}" already exist`);
        }
        this.#markSerializerSpecEntries[name] = {name, cb};
        return this;
    }

    addNodeView(name: string, cb: AddNodeViewCallback): this {
        if (this.#nodeViewEntries[name]) {
            throw new Error(`Node view with this name "${name}" already exist`);
        }
        this.#nodeViewEntries[name] = {name, cb};
        return this;
    }

    addMarkView(name: string, cb: AddMarkViewCallback): this {
        if (this.#markViewEntries[name]) {
            throw new Error(`Mark view with this name "${name}" already exist`);
        }
        this.#markViewEntries[name] = {name, cb};
        return this;
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

    build(): ExtensionSpec {
        const confMd = this.#confMdCbs.slice();
        const nodes = {...this.#nodeSpecs};
        const marks = {...this.#markSpecs};
        const nodeSpecEntries = {...this.#nodeSpecEntries};
        const markSpecEntries = {...this.#markSpecEntries};
        const parserSpecEntries = this.#parserSpecEntries.slice();
        const nodeSerializerSpecEntries = {...this.#nodeSerializerSpecEntries};
        const markSerializerSpecEntries = {...this.#markSerializerSpecEntries};
        const nodeViewEntries = {...this.#nodeViewEntries};
        const markViewEntries = {...this.#markViewEntries};
        const plugins = this.#plugins.slice();
        const actions = this.#actions.slice();

        return {
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
            nodes: () => {
                // Process both old and new node specs
                let map = OrderedMap.from<ExtensionNodeSpec>({});

                // Process old node specs (backward compatibility)
                for (const {name, cb} of Object.values(nodes)) {
                    map = map.addToEnd(name, cb());
                }

                // Process new node specs
                for (const {name, specCb} of Object.values(nodeSpecEntries)) {
                    // Build a complete ExtensionNodeSpec from separate components
                    const spec = specCb();
                    const serializer = nodeSerializerSpecEntries[name]?.cb();
                    const view = nodeViewEntries[name]?.cb;

                    // For parser specs, we need to find matching ones
                    const parserSpecs = parserSpecEntries
                        .map((entry) => entry.cb())
                        .filter((parser) => parser.nodeType === name);

                    // Use the first parser spec if available
                    const fromMd =
                        parserSpecs.length > 0
                            ? {
                                  tokenName: parserSpecs[0].tokenName,
                                  tokenSpec: parserSpecs[0].tokenSpec,
                              }
                            : {
                                  tokenSpec: {name: name, type: 'node'} as ParserToken,
                              }; // Default fallback

                    map = map.addToEnd(name, {
                        spec,
                        toMd: serializer || (() => {}),
                        fromMd,
                        ...(view ? {view: (deps) => view(deps)} : {}),
                    });
                }

                return map;
            },
            marks: () => {
                // Process both old and new mark specs

                // The order of marks in schema is important when serializing pm-document to DOM or markup
                // https://discuss.prosemirror.net/t/marks-priority/4463

                // Process old mark specs (backward compatibility)
                const sortedMarks = Object.values(marks).sort((a, b) => b.priority - a.priority);
                let map = OrderedMap.from<ExtensionMarkSpec>({});
                for (const {name, cb} of sortedMarks) {
                    map = map.addToEnd(name, cb());
                }

                // Process new mark specs
                const sortedNewMarks = Object.values(markSpecEntries).sort(
                    (a, b) => b.priority - a.priority,
                );
                for (const {name, specCb} of sortedNewMarks) {
                    // Build a complete ExtensionMarkSpec from separate components
                    const spec = specCb();
                    const serializer = markSerializerSpecEntries[name]?.cb();
                    const view = markViewEntries[name]?.cb;

                    // For parser specs, we need to find matching ones
                    const parserSpecs = parserSpecEntries
                        .map((entry) => entry.cb())
                        .filter((parser) => parser.markType === name);

                    // Use the first parser spec if available
                    const fromMd =
                        parserSpecs.length > 0
                            ? {
                                  tokenName: parserSpecs[0].tokenName,
                                  tokenSpec: parserSpecs[0].tokenSpec,
                              }
                            : {
                                  tokenSpec: {name: name, type: 'mark'} as ParserToken,
                              }; // Default fallback

                    map = map.addToEnd(name, {
                        spec,
                        toMd: serializer || {open: '', close: ''},
                        fromMd,
                        ...(view ? {view: (deps) => view(deps)} : {}),
                    });
                }

                return map;
            },
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
