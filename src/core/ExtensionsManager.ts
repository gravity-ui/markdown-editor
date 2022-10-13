import MarkdownIt from 'markdown-it';
import type {Plugin} from 'prosemirror-state';
import {ActionsManager} from './ActionsManager';
import {ExtensionBuilder} from './ExtensionBuilder';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import type {ActionSpec} from './types/actions';
import type {
    Extension,
    ExtensionDeps,
    ExtensionSpec,
    YEMarkSpec,
    YENodeSpec,
} from './types/extension';
import type {MarkViewConstructor, NodeViewConstructor} from './types/node-views';

const attrs = require('markdown-it-attrs');

type ExtensionsManagerParams = {
    extensions: Extension;
    options?: ExtensionsManagerOptions;
};

type ExtensionsManagerOptions = {
    mdOpts?: MarkdownIt.Options;
    attrsOpts?: {
        leftDelimiter?: string;
        rightDelimiter?: string;
        allowedAttributes?: string[];
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

    #md: MarkdownIt;
    #mdWithoutAttrs: MarkdownIt;
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

        this.#md = new MarkdownIt(options.mdOpts ?? {}).use(attrs, options.attrsOpts ?? {});
        this.#mdWithoutAttrs = new MarkdownIt(options.mdOpts ?? {});

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
        this.#md = this.#spec.configureMd(this.#md);
        this.#mdWithoutAttrs = this.#spec.configureMd(this.#mdWithoutAttrs);
        this.#spec.nodes().forEach(this.processNode);
        this.#spec.marks().forEach(this.processMark);
    }

    private processNode = (name: string, {spec, fromYfm, toYfm, view}: YENodeSpec) => {
        this.#schemaRegistry.addNode(name, spec);
        this.#parserRegistry.addToken(fromYfm.tokenName || name, fromYfm.tokenSpec);
        this.#serializerRegistry.addNode(name, toYfm);
        if (view) {
            this.#nodeViewCreators.set(name, view);
        }
    };

    private processMark = (name: string, {spec, fromYfm, toYfm, view}: YEMarkSpec) => {
        this.#schemaRegistry.addMark(name, spec);
        this.#parserRegistry.addToken(fromYfm.tokenName || name, fromYfm.tokenSpec);
        this.#serializerRegistry.addMark(name, toYfm);
        if (view) {
            this.#markViewCreators.set(name, view);
        }
    };

    private createDeps() {
        const schema = this.#schemaRegistry.createSchema();
        this.#deps = {
            schema,
            actions: new ActionsManager(),
            parser: this.#parserRegistry.createParser(schema, this.#md),
            parserWithoutAttrs: this.#parserRegistry.createParser(schema, this.#mdWithoutAttrs),
            serializer: this.#serializerRegistry.createSerializer(),
        };
    }

    private createDerived() {
        const plugins: {plugin: Plugin; priority: number}[] = [];
        plugins.push(...this.#spec.plugins(this.#deps));
        Object.assign(this.#actions, this.#spec.actions(this.#deps));

        // TODO: move sorting to ExtensionBuilder after WIKI-16660
        this.#plugins = plugins.sort((a, b) => b.priority - a.priority).map((item) => item.plugin);

        for (const [name, view] of this.#nodeViewCreators) {
            this.#nodeViews[name] = view(this.#deps);
        }

        for (const [name, view] of this.#markViewCreators) {
            this.#markViews[name] = view(this.#deps);
        }
    }
}
