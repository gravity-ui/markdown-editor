import uniqueId from 'lodash/uniqueId';
import MarkdownIt, {PresetName} from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {Node, Schema} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import {ActionsManager} from './ActionsManager';
import {ExtensionBuilder} from './ExtensionBuilder';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import {MarkdownParserDynamicModifier, TokenAttrs} from './markdown/MarkdownParser';
import {MarkdownSerializerDynamicModifier} from './markdown/MarkdownSerializerDynamicModifier';
import {MarkupManager} from './markdown/MarkupManager';
import {TransformFn} from './markdown/ProseMirrorTransformer';
import type {ActionSpec} from './types/actions';
import type {
    Extension,
    ExtensionDeps,
    ExtensionMarkSpec,
    ExtensionNodeSpec,
    ExtensionSpec,
} from './types/extension';
import type {MarkViewConstructor, NodeViewConstructor} from './types/node-views';
import {SerializerNodeToken, SerializerState} from './types/serializer';

type ExtensionsManagerParams = {
    extensions: Extension;
    options?: ExtensionsManagerOptions;
};

type ExtensionsManagerOptions = {
    mdOpts?: MarkdownIt.Options & {preset?: PresetName};
    linkifyTlds?: string | string[];
    pmTransformers?: TransformFn[];
    allowDynamicModifiers?: boolean;
    dynamicModifiers?: {
        parser?: MarkdownParserDynamicModifier;
        serializer?: MarkdownSerializerDynamicModifier;
    };
};

export class ExtensionsManager {
    static process(extensions: Extension, options: ExtensionsManagerOptions) {
        return new this({extensions, options}).build();
    }

    #schemaRegistry = new SchemaSpecRegistry();
    #parserRegistry = new ParserTokensRegistry();
    #serializerRegistry = new SerializerTokensRegistry();

    #nodeViewCreators = new Map<string, (deps: ExtensionDeps) => NodeViewConstructor>();
    #markViewCreators = new Map<string, (deps: ExtensionDeps) => MarkViewConstructor>();

    #pmTransformers: TransformFn[] = [];

    #mdForMarkup: MarkdownIt;
    #mdForText: MarkdownIt;
    #extensions: Extension;
    #builder: ExtensionBuilder;

    #spec!: ExtensionSpec;
    #deps!: ExtensionDeps;
    #plugins: Plugin[] = [];
    #actions: Record<string, ActionSpec> = {};
    #nodeViews: Record<string, NodeViewConstructor> = {};
    #markViews: Record<string, MarkViewConstructor> = {};
    #serializerDynamicModifier?: MarkdownSerializerDynamicModifier;
    #parserDynamicModifier?: MarkdownParserDynamicModifier;

    constructor({extensions, options = {}}: ExtensionsManagerParams) {
        this.#extensions = extensions;

        const mdPreset: PresetName = options.mdOpts?.preset ?? 'default';
        this.#mdForMarkup = new MarkdownIt(mdPreset, options.mdOpts ?? {});
        this.#mdForText = new MarkdownIt(mdPreset, options.mdOpts ?? {});

        if (options.linkifyTlds) {
            this.#mdForMarkup.linkify.tlds(options.linkifyTlds, true);
            this.#mdForText.linkify.tlds(options.linkifyTlds, true);
        }

        if (options.pmTransformers) {
            this.#pmTransformers = options.pmTransformers;
        }

        if (options.allowDynamicModifiers) {
            const markupManager = new MarkupManager();
            this.#parserDynamicModifier =
                options?.dynamicModifiers?.parser ??
                this.createParserDynamicModifier(markupManager);
            this.#serializerDynamicModifier =
                options?.dynamicModifiers?.serializer ??
                this.createSerializerDynamicModifier(markupManager);
        }

        // TODO: add prefilled context
        this.#builder = new ExtensionBuilder();
    }

    build() {
        this.processExtensions();
        this.createDeps();
        this.createDerived();

        return {
            ...this.#deps,
            actions: this.#deps.actions as ActionsManager,
            rawActions: this.#actions,
            plugins: this.#plugins,
            nodeViews: this.#nodeViews,
            markViews: this.#markViews,
        };
    }

    buildDeps() {
        this.processExtensions();
        this.createDeps();
        return this.#deps;
    }

    private processExtensions() {
        this.#spec = this.#builder.use(this.#extensions).build();
        this.#mdForMarkup = this.#spec.configureMd(this.#mdForMarkup, 'markup');
        this.#mdForText = this.#spec.configureMd(this.#mdForText, 'text');
        this.#spec.nodes().forEach(this.processNode);
        this.#spec.marks().forEach(this.processMark);
    }

    private processNode = (name: string, {spec, fromMd, toMd: toMd, view}: ExtensionNodeSpec) => {
        this.#schemaRegistry.addNode(name, spec);

        this.#parserRegistry.addToken(fromMd.tokenName || name, fromMd.tokenSpec);
        this.#serializerRegistry.addNode(name, toMd);
        if (view) {
            this.#nodeViewCreators.set(name, view);
        }
    };

    private processMark = (name: string, {spec, fromMd, toMd, view}: ExtensionMarkSpec) => {
        this.#schemaRegistry.addMark(name, spec);
        this.#parserRegistry.addToken(fromMd.tokenName || name, fromMd.tokenSpec);
        this.#serializerRegistry.addMark(name, toMd);
        if (view) {
            this.#markViewCreators.set(name, view);
        }
    };

    private createParser(schema: Schema, mdInstance: MarkdownIt) {
        return this.#parserRegistry.createParser(
            schema,
            mdInstance,
            this.#pmTransformers,
            this.#parserDynamicModifier,
        );
    }

    private createDeps() {
        const actions = new ActionsManager();

        const schema = this.#schemaRegistry.createSchema(this.#parserDynamicModifier);
        const markupParser = this.createParser(schema, this.#mdForMarkup);
        const textParser = this.createParser(schema, this.#mdForText);
        const serializer = this.#serializerRegistry.createSerializer(
            this.#serializerDynamicModifier,
        );

        this.#deps = {
            schema,
            actions,
            markupParser,
            textParser,
            serializer,
        };
    }

    private createDerived() {
        this.#plugins = this.#spec.plugins(this.#deps);
        Object.assign(this.#actions, this.#spec.actions(this.#deps));

        for (const [name, view] of this.#nodeViewCreators) {
            this.#nodeViews[name] = view(this.#deps);
        }

        for (const [name, view] of this.#markViewCreators) {
            this.#markViews[name] = view(this.#deps);
        }
    }

    private createParserDynamicModifier(markupManager: MarkupManager) {
        return new MarkdownParserDynamicModifier(createParserDynamicModifierConfig(markupManager));
    }

    private createSerializerDynamicModifier(markupManager: MarkupManager) {
        return new MarkdownSerializerDynamicModifier(
            createSerializerDynamicModifierConfig(markupManager),
        );
    }
}

const YFM_TABLE_TOKEN_ATTR = 'data-token-id';
const YFM_TABLE_NODE_ATTR = 'data-node-id';
const PARENTS_WITH_AFFECT = ['blockquote', 'yfm_tabs'];

/**
 * Creates a hook for injecting custom logic into the parsing process via `MarkdownParserDynamicModifier`,
 * allowing extensions beyond the fixed parsing rules defined by the schema.
 *
 * Dynamically configures parsing for `yfm_table` elements:
 * - Assigns a unique `data-token-id` to each token.
 * - Captures and stores the raw Markdown using `MarkupManager`.
 * - Links the token to its corresponding node via `data-node-id`.
 * - Adds the `data-node-id` attribute to the list of allowed attributes.
 */
function createParserDynamicModifierConfig(markupManager: MarkupManager) {
    return {
        ['yfm_table']: {
            processToken: [
                (token: Token, _: number, rawMarkup: string) => {
                    const {map, type} = token;
                    const tokenId = token.attrGet(YFM_TABLE_TOKEN_ATTR);

                    if (map && !tokenId) {
                        const newTokenId = uniqueId(`${type}_${Date.now()}_`);
                        token.attrSet(YFM_TABLE_TOKEN_ATTR, newTokenId);
                        markupManager.setMarkup(
                            newTokenId,
                            rawMarkup.split('\n').slice(map[0], map[1]).join('\n'),
                        );
                    }
                    return token;
                },
            ],
            processNodeAttrs: [
                (token: Token, attrs: TokenAttrs) => ({
                    ...attrs,
                    [YFM_TABLE_NODE_ATTR]: token.attrGet(YFM_TABLE_TOKEN_ATTR),
                }),
            ],
            processNode: [
                (node: Node) => {
                    const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                    if (nodeId) {
                        markupManager.setNode(nodeId, node);
                    }
                    return node;
                },
            ],
            allowedAttrs: [YFM_TABLE_NODE_ATTR],
        },
    };
}

/**
 * Creates a hook for injecting custom logic into the serialization process via `MarkdownSerializerDynamicModifier`,
 * allowing extensions beyond the standard serialization rules defined by the schema.
 *
 * Dynamically configures serialization for `yfm_table` elements:
 * - Retrieves the original Markdown using the `data-node-id` attribute.
 * - Uses the original Markdown if the node matches the saved version.
 * - Falls back to schema-based rendering if the node structure, attributes, or parent elements affect it.
 */
function createSerializerDynamicModifierConfig(markupManager: MarkupManager) {
    return {
        ['yfm_table']: {
            processNode: [
                (
                    state: SerializerState,
                    node: Node,
                    parent: Node,
                    index: number,
                    callback?: SerializerNodeToken,
                ) => {
                    const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                    const savedNode = markupManager.getNode(nodeId);

                    if (!PARENTS_WITH_AFFECT.includes(parent?.type?.name) && savedNode?.eq(node)) {
                        state.write(markupManager.getMarkup(nodeId) + '\n');
                        return;
                    }

                    callback?.(state, node, parent, index);
                },
            ],
        },
    };
}
