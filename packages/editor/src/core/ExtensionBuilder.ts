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

type EntityPipelineEntry<EntitySpec, SpecBody> =
    | {type: 'addEntity'; name: string; cb: () => EntitySpec; priority: number}
    | {type: 'addEntitySpec'; name: string; cb: () => SpecBody; priority: number}
    | {type: 'overrideEntitySpec'; name: string; cb: (prev: SpecBody) => SpecBody};

type NodePipelineEntry = EntityPipelineEntry<ExtensionNodeSpec, NodeSpec>;
type MarkPipelineEntry = EntityPipelineEntry<ExtensionMarkSpec, MarkSpec>;

type ParserPipelineEntry =
    | {type: 'addParserSpec'; tokenName: string; cb: () => ParserToken}
    | {type: 'overrideParserSpec'; tokenName: string; cb: (prev: ParserToken) => ParserToken};

type SerializerPipelineEntry<SerializerToken> =
    | {type: 'addSerializer'; name: string; cb: () => SerializerToken}
    | {type: 'overrideSerializer'; name: string; cb: (prev: SerializerToken) => SerializerToken};

type NodeSerializerPipelineEntry = SerializerPipelineEntry<SerializerNodeToken>;
type MarkSerializerPipelineEntry = SerializerPipelineEntry<SerializerMarkToken>;

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

type ResolvedParserEntry = {tokenName: string; tokenSpec: ParserToken};

function resolveParserPipeline(
    pipeline: ParserPipelineEntry[],
    initialPrimaryTokens: Record<string, string>,
    initialParsers: Record<string, ResolvedParserEntry>,
) {
    const primaryParserToken = {...initialPrimaryTokens};
    const parsers = {...initialParsers};
    const extraTokenNames: string[] = [];

    for (const entry of pipeline) {
        if (entry.type === 'addParserSpec') {
            const tokenSpec = entry.cb();
            const entityName = tokenSpec.name;

            if (primaryParserToken[entityName] === entry.tokenName) {
                // Same-name token for addNode/addMark entity — skip, already covered
                continue;
            }

            if (primaryParserToken[entityName]) {
                // Extra parser-only token targeting an existing entity
                extraTokenNames.push(entry.tokenName);
            } else {
                // Primary parser for a granular entity
                primaryParserToken[entityName] = entry.tokenName;
            }
            parsers[entry.tokenName] = {tokenName: entry.tokenName, tokenSpec};
        } else {
            // overrideParserSpec
            const existing = parsers[entry.tokenName];
            if (existing) {
                parsers[entry.tokenName] = {
                    tokenName: existing.tokenName,
                    tokenSpec: entry.cb(existing.tokenSpec),
                };
            }
        }
    }

    return {parsers, primaryParserToken, extraTokenNames};
}

function resolveSerializerPipeline<T>(
    pipeline: SerializerPipelineEntry<T>[],
    initialSerializers: Record<string, T>,
): Record<string, T> {
    const serializers = {...initialSerializers};
    for (const entry of pipeline) {
        if (entry.type === 'addSerializer') {
            serializers[entry.name] = entry.cb();
        } else {
            serializers[entry.name] = entry.cb(serializers[entry.name]);
        }
    }
    return serializers;
}

function validateGranularSpecs(
    granularNames: Set<string>,
    entityType: 'node' | 'mark',
    primaryParserToken: Record<string, string>,
    serializers: Record<string, unknown>,
): void {
    for (const name of granularNames) {
        if (!primaryParserToken[name]) {
            throw new Error(
                `Incomplete ${entityType} spec for "${name}": missing parser spec. ` +
                    `Use addMarkdownTokenParserSpec() to register a parser for this ${entityType}.`,
            );
        }
        if (!serializers[name]) {
            throw new Error(
                `Incomplete ${entityType} spec for "${name}": missing serializer. ` +
                    `Use add${entityType === 'node' ? 'Node' : 'Mark'}SerializerSpec() to register a serializer for this ${entityType}.`,
            );
        }
    }
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

function processEntityPipeline<EntitySpec extends ExtensionNodeSpec | ExtensionMarkSpec>(
    entityType: 'node' | 'mark',
    entityPipeline: EntityPipelineEntry<EntitySpec, EntitySpec['spec']>[],
    parserPipeline: ParserPipelineEntry[],
    serializerPipeline: SerializerPipelineEntry<EntitySpec['toMd']>[],
    buildParserOnlyEntry: (resolved: ResolvedParserEntry) => EntitySpec,
): OrderedMap<EntitySpec> {
    const order: {name: string; priority: number}[] = [];
    const specs: Record<string, EntitySpec['spec']> = {};
    const initParsers: Record<string, ResolvedParserEntry> = {};
    const initSerializers: Record<string, EntitySpec['toMd']> = {};
    const views: Record<string, EntitySpec['view']> = {};
    const granularEntities = new Set<string>();
    const initPrimaryTokens: Record<string, string> = {};
    const priorityByEntity: Record<string, number> = {};

    // Pass 1: entityPipeline → specs, order, raw parsers/serializers from addEntity
    for (const entry of entityPipeline) {
        const {name} = entry;

        if (entry.type === 'addEntity') {
            const base = entry.cb();
            const tokenName = base.fromMd.tokenName ?? name;
            order.push({name, priority: entry.priority});
            specs[name] = base.spec;
            initParsers[tokenName] = {tokenName, tokenSpec: base.fromMd.tokenSpec};
            initPrimaryTokens[name] = tokenName;
            priorityByEntity[name] = entry.priority;
            initSerializers[name] = base.toMd;
            views[name] = base.view;
        } else if (entry.type === 'addEntitySpec') {
            order.push({name, priority: entry.priority});
            specs[name] = entry.cb();
            priorityByEntity[name] = entry.priority;
            granularEntities.add(name);
        } else {
            // overrideEntitySpec
            specs[name] = entry.cb(specs[name]);
        }
    }

    // Pass 2: parserPipeline → fill/override parsers, add extra parser-only entries
    const {parsers, primaryParserToken, extraTokenNames} = resolveParserPipeline(
        parserPipeline,
        initPrimaryTokens,
        initParsers,
    );
    for (const tokenName of extraTokenNames) {
        // Inherit priority from the entity this token targets
        const entityName = parsers[tokenName]?.tokenSpec.name;
        const priority = entityName ? (priorityByEntity[entityName] ?? 0) : 0;
        order.push({name: tokenName, priority});
    }

    // Pass 3: serializerPipeline → fill/override serializers
    const serializers = resolveSerializerPipeline(serializerPipeline, initSerializers);

    validateGranularSpecs(granularEntities, entityType, primaryParserToken, serializers);

    if (entityType === 'mark') {
        // The order of marks in schema is important when serializing pm-document to DOM or markup
        // https://discuss.prosemirror.net/t/marks-priority/4463
        order.sort((a, b) => b.priority - a.priority);
    }

    // Assemble
    let map = OrderedMap.from<EntitySpec>({});
    for (const {name} of order) {
        const parserKey = primaryParserToken[name] ?? name;
        map = map.addToEnd(
            name,
            serializers[name]
                ? ({
                      spec: specs[name] ?? {},
                      fromMd: parsers[parserKey],
                      toMd: serializers[name],
                      ...(views[name] !== undefined && {view: views[name]}),
                  } as EntitySpec)
                : buildParserOnlyEntry(parsers[name]),
        );
    }
    return map;
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
    #plugins: {cb: AddPmPluginCallback; priority: number}[] = [];
    #actions: [string, AddActionCallback][] = [];

    // Unified pipelines — preserve registration order across legacy and granular APIs
    #nodePipeline: NodePipelineEntry[] = [];
    #nodeIndex: Record<string, {source: 'addNode' | 'addNodeSpec'}> = {};
    #markPipeline: MarkPipelineEntry[] = [];
    #markIndex: Record<string, {source: 'addMark' | 'addMarkSpec'}> = {};

    // Parser and serializer pipelines
    #parserPipeline: ParserPipelineEntry[] = [];
    #parserIndex = new Set<string>();
    #nodeSerializerPipeline: NodeSerializerPipelineEntry[] = [];
    #nodeSerializerIndex = new Set<string>();
    #markSerializerPipeline: MarkSerializerPipelineEntry[] = [];
    #markSerializerIndex = new Set<string>();

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
        return Boolean(this.#nodeIndex[name]);
    }

    hasMarkSpec(name: string): boolean {
        return Boolean(this.#markIndex[name]);
    }

    /**
     * @deprecated Will be removed in the next major version.
     * Use addNodeSpec() + addMarkdownTokenParserSpec() + addNodeSerializerSpec() instead.
     */
    addNode(name: string, cb: AddPmNodeCallback): this {
        if (this.#nodeIndex[name]?.source === 'addNode') {
            throw new Error(`ProseMirror node with this name "${name}" already exist`);
        }
        if (this.#nodeIndex[name]?.source === 'addNodeSpec') {
            throw new Error(
                `Node with name "${name}" already registered via addNodeSpec. ` +
                    `Cannot use addNode for a node that already has granular registrations.`,
            );
        }
        if (this.#nodeSerializerIndex.has(name)) {
            throw new Error(
                `Node serializer for "${name}" already registered via addNodeSerializerSpec. ` +
                    `Cannot use addNode for a node that already has granular registrations.`,
            );
        }
        this.#nodePipeline.push({type: 'addEntity', name, cb, priority: 0});
        this.#nodeIndex[name] = {source: 'addNode'};
        return this;
    }

    /**
     * @deprecated Will be removed in the next major version.
     * Use addMarkSpec() + addMarkdownTokenParserSpec() + addMarkSerializerSpec() instead.
     */
    addMark(name: string, cb: AddPmMarkCallback, priority = DEFAULT_PRIORITY): this {
        if (this.#markIndex[name]?.source === 'addMark') {
            throw new Error(`ProseMirror mark with this name "${name}" already exist`);
        }
        if (this.#markIndex[name]?.source === 'addMarkSpec') {
            throw new Error(
                `Mark with name "${name}" already registered via addMarkSpec. ` +
                    `Cannot use addMark for a mark that already has granular registrations.`,
            );
        }
        if (this.#markSerializerIndex.has(name)) {
            throw new Error(
                `Mark serializer for "${name}" already registered via addMarkSerializerSpec. ` +
                    `Cannot use addMark for a mark that already has granular registrations.`,
            );
        }
        this.#markPipeline.push({type: 'addEntity', name, cb, priority});
        this.#markIndex[name] = {source: 'addMark'};
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
        if (this.#nodeIndex[name]?.source === 'addNodeSpec') {
            throw new Error(`Node spec with name "${name}" already registered via addNodeSpec`);
        }
        if (this.#nodeIndex[name]?.source === 'addNode') {
            throw new Error(
                `Node with name "${name}" already registered via addNode. Use overrideNodeSpec to modify it.`,
            );
        }
        this.#nodePipeline.push({type: 'addEntitySpec', name, cb, priority: 0});
        this.#nodeIndex[name] = {source: 'addNodeSpec'};
        return this;
    }

    addMarkSpec(name: string, cb: () => MarkSpec, priority = DEFAULT_PRIORITY): this {
        if (this.#markIndex[name]?.source === 'addMarkSpec') {
            throw new Error(`Mark spec with name "${name}" already registered via addMarkSpec`);
        }
        if (this.#markIndex[name]?.source === 'addMark') {
            throw new Error(
                `Mark with name "${name}" already registered via addMark. Use overrideMarkSpec to modify it.`,
            );
        }
        this.#markPipeline.push({type: 'addEntitySpec', name, cb, priority});
        this.#markIndex[name] = {source: 'addMarkSpec'};
        return this;
    }

    addMarkdownTokenParserSpec(tokenName: string, cb: () => ParserToken): this {
        if (this.#parserIndex.has(tokenName)) {
            throw new Error(
                `Parser spec for token "${tokenName}" already registered via addMarkdownTokenParserSpec`,
            );
        }
        this.#parserPipeline.push({type: 'addParserSpec', tokenName, cb});
        this.#parserIndex.add(tokenName);
        return this;
    }

    addNodeSerializerSpec(name: string, cb: () => SerializerNodeToken): this {
        if (this.#nodeSerializerIndex.has(name)) {
            throw new Error(
                `Node serializer for "${name}" already registered via addNodeSerializerSpec`,
            );
        }
        if (this.#nodeIndex[name]?.source === 'addNode') {
            throw new Error(
                `Node with name "${name}" already registered via addNode. Use overrideNodeSerializerSpec to modify it.`,
            );
        }
        this.#nodeSerializerPipeline.push({type: 'addSerializer', name, cb});
        this.#nodeSerializerIndex.add(name);
        return this;
    }

    addMarkSerializerSpec(name: string, cb: () => SerializerMarkToken): this {
        if (this.#markSerializerIndex.has(name)) {
            throw new Error(
                `Mark serializer for "${name}" already registered via addMarkSerializerSpec`,
            );
        }
        if (this.#markIndex[name]?.source === 'addMark') {
            throw new Error(
                `Mark with name "${name}" already registered via addMark. Use overrideMarkSerializerSpec to modify it.`,
            );
        }
        this.#markSerializerPipeline.push({type: 'addSerializer', name, cb});
        this.#markSerializerIndex.add(name);
        return this;
    }

    overrideNodeSpec(name: string, cb: (prev: NodeSpec) => NodeSpec): this {
        if (!this.#nodeIndex[name]) {
            throw new Error(
                `Cannot override node spec "${name}": not registered. Use addNode() or addNodeSpec() first.`,
            );
        }
        this.#nodePipeline.push({type: 'overrideEntitySpec', name, cb});
        return this;
    }

    overrideMarkSpec(name: string, cb: (prev: MarkSpec) => MarkSpec): this {
        if (!this.#markIndex[name]) {
            throw new Error(
                `Cannot override mark spec "${name}": not registered. Use addMark() or addMarkSpec() first.`,
            );
        }
        this.#markPipeline.push({type: 'overrideEntitySpec', name, cb});
        return this;
    }

    overrideMarkdownTokenParserSpec(
        tokenName: string,
        cb: (prev: ParserToken) => ParserToken,
    ): this {
        if (
            !this.#parserIndex.has(tokenName) &&
            !this.#nodeIndex[tokenName] &&
            !this.#markIndex[tokenName]
        ) {
            throw new Error(
                `Cannot override parser spec for token "${tokenName}": not registered. ` +
                    `Use addMarkdownTokenParserSpec(), addNode(), or addMark() first.`,
            );
        }
        this.#parserPipeline.push({type: 'overrideParserSpec', tokenName, cb});
        return this;
    }

    overrideNodeSerializerSpec(
        name: string,
        cb: (prev: SerializerNodeToken) => SerializerNodeToken,
    ): this {
        if (this.#nodeIndex[name]?.source !== 'addNode' && !this.#nodeSerializerIndex.has(name)) {
            throw new Error(
                `Cannot override node serializer "${name}": not registered. Use addNode() or addNodeSerializerSpec() first.`,
            );
        }
        this.#nodeSerializerPipeline.push({type: 'overrideSerializer', name, cb});
        return this;
    }

    overrideMarkSerializerSpec(
        name: string,
        cb: (prev: SerializerMarkToken) => SerializerMarkToken,
    ): this {
        if (this.#markIndex[name]?.source !== 'addMark' && !this.#markSerializerIndex.has(name)) {
            throw new Error(
                `Cannot override mark serializer "${name}": not registered. Use addMark() or addMarkSerializerSpec() first.`,
            );
        }
        this.#markSerializerPipeline.push({type: 'overrideSerializer', name, cb});
        return this;
    }

    build(): ExtensionSpec {
        const confMd = this.#confMdCbs.slice();
        const nodePipeline = this.#nodePipeline.slice();
        const markPipeline = this.#markPipeline.slice();
        const parserPipeline = this.#parserPipeline.slice();
        const nodeSerializerPipeline = this.#nodeSerializerPipeline.slice();
        const markSerializerPipeline = this.#markSerializerPipeline.slice();
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
            nodes: () =>
                processEntityPipeline<ExtensionNodeSpec>(
                    'node',
                    nodePipeline,
                    parserPipeline,
                    nodeSerializerPipeline,
                    buildParserOnlyNodeEntry,
                ),
            marks: () =>
                processEntityPipeline<ExtensionMarkSpec>(
                    'mark',
                    markPipeline,
                    parserPipeline,
                    markSerializerPipeline,
                    buildParserOnlyMarkEntry,
                ),
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
