import type MarkdownIt from 'markdown-it';
import OrderedMap from 'orderedmap'; // eslint-disable-line import/no-extraneous-dependencies
import {inputRules} from 'prosemirror-inputrules';
import {keymap} from 'prosemirror-keymap';
import type {Plugin} from 'prosemirror-state';

import type {MarkSpec, NodeSpec} from '#pm/model';

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

/** @deprecated */
type AddPmNodeCallback = () => ExtensionNodeSpec;
/** @deprecated */
type AddPmMarkCallback = () => ExtensionMarkSpec;

type AddPmNodeSpecCallback = () => NodeSpec;
type AddPmMarkSpecCallback = () => MarkSpec;

type AddMdParserSpecCallback = () => ExtensionMarkSpec['fromMd'];
type AddMdSerializerNodeSpec = () => SerializerNodeToken;
type AddMdSerializerMarkSpec = () => SerializerMarkToken;

type AddPmNodeViewCallback = () => NonNullable<ExtensionNodeSpec['view']>;
type AddPmMarkViewCallback = () => NonNullable<ExtensionMarkSpec['view']>;

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

    #nodeSpecs: Record<string, {name: string; cb: AddPmNodeSpecCallback}> = {};
    #markSpecs: Record<string, {name: string; cb: AddPmMarkSpecCallback; priority: number}> = {};

    // name – name of pm entity, not token type
    #parserSpecs: Record<string, {name: string; cb: AddMdParserSpecCallback}> = {};
    #serializerNodeSpecs: Record<string, {name: string; cb: AddMdSerializerNodeSpec}> = {};
    #serializerMarkSpecs: Record<string, {name: string; cb: AddMdSerializerMarkSpec}> = {};

    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];
    #nodeViews: Record<string, AddPmNodeViewCallback> = {};
    #markViews: Record<string, AddPmMarkViewCallback> = {};

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

    addMdParserSpec(tokenType: string, cb: () => ParserToken): this {
        const entityName = cb().name;
        if (this.#parserSpecs[entityName]) {
            throw new Error(`ParserSpec for this node "${entityName}" already exist`);
        }
        this.#parserSpecs[entityName] = {
            name: entityName,
            cb: () => ({tokenName: tokenType, tokenSpec: cb()}),
        };
        return this;
    }

    addMdSerializerNodeSpec(nodeName: string, cb: AddMdSerializerNodeSpec): this {
        if (this.#serializerNodeSpecs[nodeName]) {
            throw new Error(`SerializerNodeSpec for this node "${nodeName}" already exist`);
        }
        this.#serializerNodeSpecs[nodeName] = {name: nodeName, cb};
        return this;
    }

    addMdSerializerMarkSpec(markName: string, cb: AddMdSerializerMarkSpec): this {
        if (this.#serializerNodeSpecs[markName]) {
            throw new Error(`SerializerNodeSpec for this mark "${markName}" already exist`);
        }
        this.#serializerMarkSpecs[markName] = {name: markName, cb};
        return this;
    }

    /** @deprecated */
    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeSpecs[name] || this.#parserSpecs[name] || this.#serializerNodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        this.#nodeSpecs[name] = {name, cb: () => cb().spec};
        this.#parserSpecs[name] = {name, cb: () => cb().fromMd};
        this.#serializerNodeSpecs[name] = {name, cb: () => cb().toMd};
        return this;
    }

    addNodeSpec(name: string, cb: AddPmNodeSpecCallback): this {
        if (this.#nodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        this.#nodeSpecs[name] = {name, cb};
        return this;
    }

    addNodeView(name: string, cb: AddPmNodeViewCallback): this {
        if (!this.#nodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" not found`);
        }
        if (this.#nodeViews[name]) {
            this.logger.warn(`Builder: nodeView "${name}" already exists. Overriding it`);
        }
        this.#nodeViews[name] = cb;
        return this;
    }

    /** @deprecated */
    addMark(name: string, cb: AddPmMarkCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        this.#markSpecs[name] = {name, cb: () => cb().spec, priority};
        this.#parserSpecs[name] = {name, cb: () => cb().fromMd};
        this.#serializerMarkSpecs[name] = {name, cb: () => cb().toMd};
        return this;
    }

    addMarkSpec(name: string, cb: AddPmMarkSpecCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        this.#markSpecs[name] = {name, cb, priority};
        return this;
    }

    addMarkView(name: string, cb: AddPmMarkViewCallback): this {
        if (!this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" not found`);
        }
        if (this.#markViews[name]) {
            this.logger.warn(`Builder: markView "${name}" already exists. Overriding it`);
        }
        this.#markViews[name] = cb;
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
                let map = OrderedMap.from<ExtensionNodeSpec>({});
                for (const {name, cb} of Object.values(nodes)) {
                    map = map.addToEnd(name, cb());
                }
                return map;
            },
            marks: () => {
                // The order of marks in schema is important when serializing pm-document to DOM or markup
                // https://discuss.prosemirror.net/t/marks-priority/4463
                const sortedMarks = Object.values(marks).sort((a, b) => b.priority - a.priority);
                let map = OrderedMap.from<ExtensionMarkSpec>({});
                for (const {name, cb} of sortedMarks) {
                    map = map.addToEnd(name, cb());
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
