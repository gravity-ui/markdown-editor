import type MarkdownIt from 'markdown-it';
import OrderedMap from 'orderedmap';
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
import type {ParserToken} from './types/parser';
import type {SerializerMarkToken, SerializerNodeToken} from './types/serializer';

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

function applyOverrides<T>(initial: T, overrides?: Array<(prev: T) => T>): T {
    return overrides ? overrides.reduce((acc, fn) => fn(acc), initial) : initial;
}

type ResolvedParserEntry = {tokenName: string; tokenSpec: ParserToken};
type ParserOverridesMap = Record<string, Array<(prev: ParserToken) => ParserToken>>;

function resolveParserEntry(
    entry: {tokenName: string; tokenSpec: ParserToken},
    overrides: ParserOverridesMap,
): ResolvedParserEntry {
    return {
        tokenName: entry.tokenName,
        tokenSpec: applyOverrides(entry.tokenSpec, overrides[entry.tokenName]),
    };
}

function resolveGranularParserEntries(
    entityName: string,
    entityType: 'node' | 'mark',
    parserSpecsByEntity: Record<string, ResolvedParserEntry[]>,
    overrides: ParserOverridesMap,
): {primary: ResolvedParserEntry; extra: ResolvedParserEntry[]} {
    const entries = parserSpecsByEntity[entityName];
    if (!entries || entries.length === 0) {
        throw new Error(
            `Incomplete ${entityType} spec for "${entityName}": missing parser spec. ` +
                `Use addMarkdownTokenParserSpec() to register a parser for this ${entityType}.`,
        );
    }

    const [primaryRaw, ...extraRaw] = entries;
    return {
        primary: resolveParserEntry(primaryRaw, overrides),
        extra: extraRaw.map((e) => resolveParserEntry(e, overrides)),
    };
}

function buildParserOnlyNodeEntry(resolved: ResolvedParserEntry): ExtensionNodeSpec {
    return {
        spec: {},
        fromMd: {tokenName: resolved.tokenName, tokenSpec: resolved.tokenSpec},
        toMd: () => {
            throw new Error(`Unexpected toMd() call on parser-only node "${resolved.tokenName}"`);
        },
    };
}

function buildParserOnlyMarkEntry(resolved: ResolvedParserEntry): ExtensionMarkSpec {
    return {
        spec: {},
        fromMd: {tokenName: resolved.tokenName, tokenSpec: resolved.tokenSpec},
        toMd: {open: '', close: ''},
    };
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

    // Granular add storage
    #rawNodeSpecs: Record<string, () => NodeSpec> = {};
    #rawMarkSpecs: Record<string, {cb: () => MarkSpec; priority: number}> = {};
    #rawParserSpecs: Record<string, {tokenName: string; cb: () => ParserToken}> = {};
    #rawNodeSerializers: Record<string, () => SerializerNodeToken> = {};
    #rawMarkSerializers: Record<string, () => SerializerMarkToken> = {};

    // Override chains
    #nodeSpecOverrides: Record<string, Array<(prev: NodeSpec) => NodeSpec>> = {};
    #markSpecOverrides: Record<string, Array<(prev: MarkSpec) => MarkSpec>> = {};
    #parserSpecOverrides: Record<string, Array<(prev: ParserToken) => ParserToken>> = {};
    #nodeSerializerOverrides: Record<
        string,
        Array<(prev: SerializerNodeToken) => SerializerNodeToken>
    > = {};
    #markSerializerOverrides: Record<
        string,
        Array<(prev: SerializerMarkToken) => SerializerMarkToken>
    > = {};

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
        return Boolean(this.#nodeSpecs[name]) || Boolean(this.#rawNodeSpecs[name]);
    }

    hasMarkSpec(name: string): boolean {
        return Boolean(this.#markSpecs[name]) || Boolean(this.#rawMarkSpecs[name]);
    }

    /**
     * @deprecated Will be removed in the next major version.
     * Use addNodeSpec() + addMarkdownTokenParserSpec() + addNodeSerializerSpec() instead.
     */
    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeSpecs[name]) {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        if (this.#rawNodeSpecs[name]) {
            throw new Error(
                `Node with name "${name}" already registered via addNodeSpec. ` +
                    `Cannot use addNode for a node that already has granular registrations.`,
            );
        }
        if (this.#rawNodeSerializers[name]) {
            throw new Error(
                `Node serializer for "${name}" already registered via addNodeSerializerSpec. ` +
                    `Cannot use addNode for a node that already has granular registrations.`,
            );
        }
        this.#nodeSpecs[name] = {name, cb};
        return this;
    }

    /**
     * @deprecated Will be removed in the next major version.
     * Use addMarkSpec() + addMarkdownTokenParserSpec() + addMarkSerializerSpec() instead.
     */
    addMark(name: string, cb: AddPmMarkCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markSpecs[name]) {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        if (this.#rawMarkSpecs[name]) {
            throw new Error(
                `Mark with name "${name}" already registered via addMarkSpec. ` +
                    `Cannot use addMark for a mark that already has granular registrations.`,
            );
        }
        if (this.#rawMarkSerializers[name]) {
            throw new Error(
                `Mark serializer for "${name}" already registered via addMarkSerializerSpec. ` +
                    `Cannot use addMark for a mark that already has granular registrations.`,
            );
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

    addNodeSpec(name: string, cb: () => NodeSpec): this {
        if (this.#rawNodeSpecs[name]) {
            throw new Error(`Node spec with name "${name}" already registered via addNodeSpec`);
        }
        if (this.#nodeSpecs[name]) {
            throw new Error(
                `Node with name "${name}" already registered via addNode. Use overrideNodeSpec to modify it.`,
            );
        }
        this.#rawNodeSpecs[name] = cb;
        return this;
    }

    addMarkSpec(name: string, cb: () => MarkSpec, priority = DEFAULT_PRIORITY): this {
        if (this.#rawMarkSpecs[name]) {
            throw new Error(`Mark spec with name "${name}" already registered via addMarkSpec`);
        }
        if (this.#markSpecs[name]) {
            throw new Error(
                `Mark with name "${name}" already registered via addMark. Use overrideMarkSpec to modify it.`,
            );
        }
        this.#rawMarkSpecs[name] = {cb, priority};
        return this;
    }

    addMarkdownTokenParserSpec(tokenName: string, cb: () => ParserToken): this {
        if (this.#rawParserSpecs[tokenName]) {
            throw new Error(
                `Parser spec for token "${tokenName}" already registered via addMarkdownTokenParserSpec`,
            );
        }
        this.#rawParserSpecs[tokenName] = {tokenName, cb};
        return this;
    }

    addNodeSerializerSpec(name: string, cb: () => SerializerNodeToken): this {
        if (this.#rawNodeSerializers[name]) {
            throw new Error(
                `Node serializer for "${name}" already registered via addNodeSerializerSpec`,
            );
        }
        if (this.#nodeSpecs[name]) {
            throw new Error(
                `Node with name "${name}" already registered via addNode. Use overrideNodeSerializerSpec to modify it.`,
            );
        }
        this.#rawNodeSerializers[name] = cb;
        return this;
    }

    addMarkSerializerSpec(name: string, cb: () => SerializerMarkToken): this {
        if (this.#rawMarkSerializers[name]) {
            throw new Error(
                `Mark serializer for "${name}" already registered via addMarkSerializerSpec`,
            );
        }
        if (this.#markSpecs[name]) {
            throw new Error(
                `Mark with name "${name}" already registered via addMark. Use overrideMarkSerializerSpec to modify it.`,
            );
        }
        this.#rawMarkSerializers[name] = cb;
        return this;
    }

    overrideNodeSpec(name: string, cb: (prev: NodeSpec) => NodeSpec): this {
        if (!this.#nodeSpecs[name] && !this.#rawNodeSpecs[name]) {
            throw new Error(
                `Cannot override node spec "${name}": not registered. Use addNode() or addNodeSpec() first.`,
            );
        }
        (this.#nodeSpecOverrides[name] ??= []).push(cb);
        return this;
    }

    overrideMarkSpec(name: string, cb: (prev: MarkSpec) => MarkSpec): this {
        if (!this.#markSpecs[name] && !this.#rawMarkSpecs[name]) {
            throw new Error(
                `Cannot override mark spec "${name}": not registered. Use addMark() or addMarkSpec() first.`,
            );
        }
        (this.#markSpecOverrides[name] ??= []).push(cb);
        return this;
    }

    overrideMarkdownTokenParserSpec(
        tokenName: string,
        cb: (prev: ParserToken) => ParserToken,
    ): this {
        if (
            !this.#rawParserSpecs[tokenName] &&
            !this.#nodeSpecs[tokenName] &&
            !this.#markSpecs[tokenName]
        ) {
            throw new Error(
                `Cannot override parser spec for token "${tokenName}": not registered. ` +
                    `Use addMarkdownTokenParserSpec(), addNode(), or addMark() first.`,
            );
        }
        (this.#parserSpecOverrides[tokenName] ??= []).push(cb);
        return this;
    }

    overrideNodeSerializerSpec(
        name: string,
        cb: (prev: SerializerNodeToken) => SerializerNodeToken,
    ): this {
        if (!this.#nodeSpecs[name] && !this.#rawNodeSerializers[name]) {
            throw new Error(
                `Cannot override node serializer "${name}": not registered. Use addNode() or addNodeSerializerSpec() first.`,
            );
        }
        (this.#nodeSerializerOverrides[name] ??= []).push(cb);
        return this;
    }

    overrideMarkSerializerSpec(
        name: string,
        cb: (prev: SerializerMarkToken) => SerializerMarkToken,
    ): this {
        if (!this.#markSpecs[name] && !this.#rawMarkSerializers[name]) {
            throw new Error(
                `Cannot override mark serializer "${name}": not registered. Use addMark() or addMarkSerializerSpec() first.`,
            );
        }
        (this.#markSerializerOverrides[name] ??= []).push(cb);
        return this;
    }

    build(): ExtensionSpec {
        const confMd = this.#confMdCbs.slice();
        const nodes = {...this.#nodeSpecs};
        const marks = {...this.#markSpecs};
        const plugins = this.#plugins.slice();
        const actions = this.#actions.slice();

        const rawNodeSpecs = {...this.#rawNodeSpecs};
        const rawMarkSpecs = {...this.#rawMarkSpecs};
        const rawParserSpecs = {...this.#rawParserSpecs};
        const rawNodeSerializers = {...this.#rawNodeSerializers};
        const rawMarkSerializers = {...this.#rawMarkSerializers};

        const nodeSpecOverrides = {...this.#nodeSpecOverrides};
        const markSpecOverrides = {...this.#markSpecOverrides};
        const parserSpecOverrides = {...this.#parserSpecOverrides};
        const nodeSerializerOverrides = {...this.#nodeSerializerOverrides};
        const markSerializerOverrides = {...this.#markSerializerOverrides};

        // Pre-build entity name → parser specs lookup for O(1) access
        // Multiple markdown-it tokens can map to the same ProseMirror entity
        // (e.g. both 'fence' and 'code_block' tokens → 'code_block' node)
        const parserSpecsByEntity: Record<
            string,
            Array<{tokenName: string; tokenSpec: ParserToken}>
        > = {};
        for (const {tokenName, cb} of Object.values(rawParserSpecs)) {
            const tokenSpec = cb();
            (parserSpecsByEntity[tokenSpec.name] ??= []).push({tokenName, tokenSpec});
        }

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

                // 1. Process addNode entries with overrides
                for (const {name, cb} of Object.values(nodes)) {
                    const base = cb();
                    const tokenName = base.fromMd.tokenName ?? name;
                    const hasOverrides =
                        nodeSpecOverrides[name] ||
                        parserSpecOverrides[tokenName] ||
                        nodeSerializerOverrides[name];

                    if (hasOverrides) {
                        map = map.addToEnd(name, {
                            spec: applyOverrides(base.spec, nodeSpecOverrides[name]),
                            fromMd: {
                                tokenName: base.fromMd.tokenName,
                                tokenSpec: applyOverrides(
                                    base.fromMd.tokenSpec,
                                    parserSpecOverrides[tokenName],
                                ),
                            },
                            toMd: applyOverrides(base.toMd, nodeSerializerOverrides[name]),
                            view: base.view,
                        });
                    } else {
                        map = map.addToEnd(name, base);
                    }
                }

                // 1b. Add parser-only entries for rawParserSpecs tokens targeting addNode entities
                for (const {name} of Object.values(nodes)) {
                    const entries = parserSpecsByEntity[name];
                    if (entries) {
                        for (const entry of entries) {
                            // Skip when tokenName matches the entity name —
                            // the full spec was already added in step 1
                            if (entry.tokenName === name) continue;
                            map = map.addToEnd(
                                entry.tokenName,
                                buildParserOnlyNodeEntry(
                                    resolveParserEntry(entry, parserSpecOverrides),
                                ),
                            );
                        }
                    }
                }

                // 2. Process granular-only nodes
                for (const name of Object.keys(rawNodeSpecs)) {
                    const spec = applyOverrides(rawNodeSpecs[name](), nodeSpecOverrides[name]);

                    const {primary, extra} = resolveGranularParserEntries(
                        name,
                        'node',
                        parserSpecsByEntity,
                        parserSpecOverrides,
                    );

                    if (!rawNodeSerializers[name]) {
                        throw new Error(
                            `Incomplete node spec for "${name}": missing serializer. ` +
                                `Use addNodeSerializerSpec() to register a serializer for this node.`,
                        );
                    }
                    const toMd = applyOverrides(
                        rawNodeSerializers[name](),
                        nodeSerializerOverrides[name],
                    );

                    map = map.addToEnd(name, {
                        spec,
                        fromMd: {tokenName: primary.tokenName, tokenSpec: primary.tokenSpec},
                        toMd,
                    });

                    for (const entry of extra) {
                        map = map.addToEnd(entry.tokenName, buildParserOnlyNodeEntry(entry));
                    }
                }

                return map;
            },
            marks: () => {
                // The order of marks in schema is important when serializing pm-document to DOM or markup
                // https://discuss.prosemirror.net/t/marks-priority/4463

                // 1. Process addMark entries with overrides
                const allMarks: {
                    name: string;
                    priority: number;
                    buildSpec: () => ExtensionMarkSpec;
                }[] = [];

                for (const {name, cb, priority} of Object.values(marks)) {
                    allMarks.push({
                        name,
                        priority,
                        buildSpec: () => {
                            const base = cb();
                            const tokenName = base.fromMd.tokenName ?? name;
                            const hasOverrides =
                                markSpecOverrides[name] ||
                                parserSpecOverrides[tokenName] ||
                                markSerializerOverrides[name];

                            if (hasOverrides) {
                                return {
                                    spec: applyOverrides(base.spec, markSpecOverrides[name]),
                                    fromMd: {
                                        tokenName: base.fromMd.tokenName,
                                        tokenSpec: applyOverrides(
                                            base.fromMd.tokenSpec,
                                            parserSpecOverrides[tokenName],
                                        ),
                                    },
                                    toMd: applyOverrides(base.toMd, markSerializerOverrides[name]),
                                    view: base.view,
                                };
                            }
                            return base;
                        },
                    });
                }

                // 1b. Add parser-only entries for rawParserSpecs tokens targeting addMark entities
                for (const {name, priority} of Object.values(marks)) {
                    const entries = parserSpecsByEntity[name];
                    if (entries) {
                        for (const entry of entries) {
                            // Skip when tokenName matches the entity name —
                            // the full spec was already added in step 1
                            if (entry.tokenName === name) continue;
                            allMarks.push({
                                name: entry.tokenName,
                                priority,
                                buildSpec: () =>
                                    buildParserOnlyMarkEntry(
                                        resolveParserEntry(entry, parserSpecOverrides),
                                    ),
                            });
                        }
                    }
                }

                // 2. Process granular-only marks
                for (const name of Object.keys(rawMarkSpecs)) {
                    const {cb: specCb, priority} = rawMarkSpecs[name];

                    const {primary, extra} = resolveGranularParserEntries(
                        name,
                        'mark',
                        parserSpecsByEntity,
                        parserSpecOverrides,
                    );

                    if (!rawMarkSerializers[name]) {
                        throw new Error(
                            `Incomplete mark spec for "${name}": missing serializer. ` +
                                `Use addMarkSerializerSpec() to register a serializer for this mark.`,
                        );
                    }

                    allMarks.push({
                        name,
                        priority,
                        buildSpec: () => {
                            const spec = applyOverrides(specCb(), markSpecOverrides[name]);
                            const toMd = applyOverrides(
                                rawMarkSerializers[name](),
                                markSerializerOverrides[name],
                            );
                            return {
                                spec,
                                fromMd: {
                                    tokenName: primary.tokenName,
                                    tokenSpec: primary.tokenSpec,
                                },
                                toMd,
                            };
                        },
                    });

                    for (const entry of extra) {
                        allMarks.push({
                            name: entry.tokenName,
                            priority,
                            buildSpec: () => buildParserOnlyMarkEntry(entry),
                        });
                    }
                }

                allMarks.sort((a, b) => b.priority - a.priority);
                let map = OrderedMap.from<ExtensionMarkSpec>({});
                for (const {name, buildSpec} of allMarks) {
                    map = map.addToEnd(name, buildSpec());
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
