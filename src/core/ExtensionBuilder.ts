import OrderedMap from 'orderedmap';
import type MarkdownIt from 'markdown-it';
import type {Plugin} from 'prosemirror-state';
import {keymap} from 'prosemirror-keymap';
import {inputRules} from 'prosemirror-inputrules';

import type {Keymap} from './types/keymap';
import type {ActionSpec} from './types/actions';
import type {
    Extension,
    ExtensionWithOptions,
    ExtensionDeps,
    ExtensionSpec,
    YEMarkSpec,
    YENodeSpec,
} from './types/extension';

type InputRulesConfig = Parameters<typeof inputRules>[0];
type ExtensionWithParams = (builder: ExtensionBuilder, ...params: any[]) => void;

type ConfigureMdCallback = (md: MarkdownIt) => MarkdownIt;
type AddPmNodeCallback = () => YENodeSpec;
type AddPmMarkCallback = () => YEMarkSpec;
type AddPmPluginCallback = (deps: ExtensionDeps) => Plugin | Plugin[];
type AddPmKeymapCallback = (deps: ExtensionDeps) => Keymap;
type AddPmInputRulesCallback = (deps: ExtensionDeps) => InputRulesConfig;
type AddActionCallback = (deps: ExtensionDeps) => ActionSpec;

enum PluginPriority {
    Highest = 1_000_000,
    VeryHigh = 100_000,
    High = 10_000,
    Medium = 1_000,
    Low = 100,
    VeryLow = 10,
    Lowest = 0,
}

const DEFAULT_PRIORITY = PluginPriority.Medium;

type BuilderContext<T extends object> = {
    has(key: keyof T): boolean;
    get<K extends keyof T>(key: K): T[K] | undefined;
    set<K extends keyof T>(key: K, value: T[K]): BuilderContext<T>;
};

declare global {
    namespace YfmEditor {
        interface Context {}
    }
}

export class ExtensionBuilder {
    static createContext(): BuilderContext<YfmEditor.Context> {
        return new Map();
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    static readonly PluginPriority = PluginPriority;
    readonly PluginPriority = ExtensionBuilder.PluginPriority;

    #confMdCbs: ConfigureMdCallback[] = [];
    #nodeSpecs: [string, AddPmNodeCallback][] = [];
    #markSpecs: [string, AddPmMarkCallback][] = [];
    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];

    readonly context: BuilderContext<YfmEditor.Context>;

    constructor(context?: BuilderContext<YfmEditor.Context>) {
        this.context = context ?? ExtensionBuilder.createContext();
    }

    use(extension: Extension): this;
    use<T>(extension: ExtensionWithOptions<T>, options: T): this;
    use(extension: ExtensionWithParams, ...params: any[]): this {
        extension(this, ...params);
        return this;
    }

    configureMd(cb: ConfigureMdCallback): this {
        this.#confMdCbs.push(cb);
        return this;
    }

    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeSpecs.some(([specName]) => specName === name)) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        this.#nodeSpecs.push([name, cb]);
        return this;
    }

    addMark(name: string, cb: AddPmMarkCallback): this {
        if (this.#markSpecs.some(([specName]) => specName === name)) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        this.#markSpecs.push([name, cb]);
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
            throw new Error(`[YFM Editor] action with this name "${name}" already exist`);
        }
        this.#actions.push([name, cb]);
        return this;
    }

    build(): ExtensionSpec {
        const confMd = this.#confMdCbs.slice();
        const nodes = this.#nodeSpecs.slice();
        const marks = this.#markSpecs.slice();
        const plugins = this.#plugins.slice();
        const actions = this.#actions.slice();

        return {
            configureMd: (md) => confMd.reduce((pMd, cb) => cb(pMd), md),
            nodes: () => {
                let map = OrderedMap.from<YENodeSpec>({});
                for (const [key, cb] of nodes) {
                    map = map.addToEnd(key, cb());
                }
                return map;
            },
            marks: () => {
                let map = OrderedMap.from<YEMarkSpec>({});
                for (const [key, cb] of marks) {
                    map = map.addToEnd(key, cb());
                }
                return map;
            },
            plugins: (deps) => {
                // TODO: sort plugins here after WIKI-16660
                return plugins.reduce<{plugin: Plugin; priority: number}[]>(
                    (acc, {cb, priority}) => {
                        const res = cb(deps);
                        if (Array.isArray(res))
                            acc.push(...res.map((plugin) => ({plugin, priority})));
                        else acc.push({plugin: res, priority});
                        return acc;
                    },
                    [],
                );
            },
            actions: (deps) =>
                actions.reduce((obj, [name, cb]) => {
                    obj[name] = cb(deps);
                    return obj;
                }, {} as Record<string, ActionSpec>),
        };
    }
}
