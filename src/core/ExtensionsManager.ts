import MarkdownIt, {PresetName} from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {Node} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import {ActionsManager} from './ActionsManager';
import {ExtensionBuilder} from './ExtensionBuilder';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import {MarkdownParserDynamicModifier, TokenAttrs} from './markdown/MarkdownParser';
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

type ExtensionsManagerParams = {
    extensions: Extension;
    options?: ExtensionsManagerOptions;
};

type ExtensionsManagerOptions = {
    mdOpts?: MarkdownIt.Options & {preset?: PresetName};
    linkifyTlds?: string | string[];
    pmTransformers?: TransformFn[];
};

/**
 * Generate a unique token ID
 */
export function createUniqueId(prefix: string): string {
    const randomLetters = Array.from(
        {length: 5},
        () => String.fromCharCode(97 + Math.floor(Math.random() * 26)), // a-z
    ).join('');

    return `${prefix}-${randomLetters}${Date.now()}`;
}

const getDynamicModifierConfig = (markupManager: MarkupManager) => ({
    ['yfm_table']: {
        processToken: [
            (token: Token) => {
                token.attrSet('data-token-id', createUniqueId(token.type));
                return token;
            },
            (token: Token, _: number, rawMarkup: string) => {
                const tokenId = token.attrGet('data-token-id');
                const {map} = token;

                if (tokenId && map) {
                    const [lineBegin, lineEnd] = map;
                    const lines = rawMarkup.split('\n');
                    const selectedMarkup = lines.slice(lineBegin, lineEnd).join('\n');
                    console.log('selectedMarkup', selectedMarkup);
                    markupManager.setMarkup(tokenId, selectedMarkup);
                }
                return token;
            },
            (token: Token, _: number, rawMarkup: string) => {
                const tokenId = token.attrGet('data-token-;id');
                if (tokenId) {
                    markupManager.setMarkup(tokenId, rawMarkup);
                }
                return token;
            },
        ],
        processNodeAttrs: [
            (token: Token, attrs: TokenAttrs) => {
                attrs['data-node-id'] = token.attrGet('data-token-id');
                return attrs;
            },
        ],
        processNode: [
            (node: Node) => {
                const nodeId = node.attrs['data-node-id'];
                if (nodeId) {
                    markupManager.setNode(nodeId, node);
                }

                return node;
            },
        ],
        allowedAttrs: ['data-node-id'],
    },
});

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

    private createDeps() {
        const actions = new ActionsManager();

        const markupManager = new MarkupManager();
        const dynamicModifierConfig = getDynamicModifierConfig(markupManager);
        const dynamicModifier = new MarkdownParserDynamicModifier(dynamicModifierConfig);

        const schema = this.#schemaRegistry.createSchema(dynamicModifier);
        const markupParser = this.#parserRegistry.createParser(
            schema,
            this.#mdForMarkup,
            this.#pmTransformers,
            dynamicModifier,
        );
        const textParser = this.#parserRegistry.createParser(
            schema,
            this.#mdForText,
            this.#pmTransformers,
            dynamicModifier,
        );

        const serializer = this.#serializerRegistry.createSerializer();

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
}
