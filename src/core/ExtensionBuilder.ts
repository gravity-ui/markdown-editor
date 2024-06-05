import type MarkdownIt from 'markdown-it';
import OrderedMap from 'orderedmap'; // eslint-disable-line import/no-extraneous-dependencies
import {inputRules} from 'prosemirror-inputrules';
import {keymap} from 'prosemirror-keymap';
import type {Plugin} from 'prosemirror-state';

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
    /** @deprecated use `ExtensionBuilder.Priority` instead */
    static readonly PluginPriority = ExtensionBuilder.Priority;
    /** @deprecated use `builder.Priority` instead */
    readonly PluginPriority = ExtensionBuilder.PluginPriority;
    /* eslint-enable @typescript-eslint/member-ordering */

    #confMdCbs: {cb: ConfigureMdCallback; params: Required<ConfigureMdParams>}[] = [];
    #nodeSpecs: Record<string, {name: string; cb: AddPmNodeCallback}> = {};
    #markSpecs: Record<string, {name: string; cb: AddPmMarkCallback; priority: number}> = {};
    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];

    readonly context: BuilderContext<WysiwygEditor.Context>;

    constructor(context?: BuilderContext<WysiwygEditor.Context>) {
        this.context = context ?? ExtensionBuilder.createContext();
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

    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        this.#nodeSpecs[name] = {name, cb};
        return this;
    }

    addMark(name: string, cb: AddPmMarkCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        this.#markSpecs[name] = {name, cb, priority};
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
