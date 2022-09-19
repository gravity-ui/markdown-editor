import MarkdownIt from 'markdown-it';
import type {Plugin} from 'prosemirror-state';
import {ActionsManager} from './ActionsManager';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import type {ActionSpec} from './types/actions';
import type {ExtensionDeps, ExtensionSpec, YEMarkSpec, YENodeSpec} from './types/extension';
import type {MarkViewConstructor, NodeViewConstructor} from './types/node-views';

const attrs = require('markdown-it-attrs');

type ExtensionsManagerParams = {
    extensions: ExtensionSpec[];
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
    static process(extensions: ExtensionSpec[], options: ExtensionsManagerOptions) {
        return new this({extensions, options}).build();
    }

    #schemaRegistry = new SchemaSpecRegistry();
    #parserRegistry = new ParserTokensRegistry();
    #serializerRegistry = new SerializerTokensRegistry();

    #nodeViewCreators = new Map<string, (deps: ExtensionDeps) => NodeViewConstructor>();
    #markViewCreators = new Map<string, (deps: ExtensionDeps) => MarkViewConstructor>();

    #md: MarkdownIt;
    #mdWithoutAttrs: MarkdownIt;
    #extensions: ExtensionSpec[];

    #deps!: ExtensionDeps;
    #plugins: Plugin[] = [];
    #actions: Record<string, ActionSpec> = {};
    #nodeViews: Record<string, NodeViewConstructor> = {};
    #markViews: Record<string, MarkViewConstructor> = {};

    constructor({extensions, options = {}}: ExtensionsManagerParams) {
        this.#extensions = extensions;

        this.#md = new MarkdownIt(options.mdOpts ?? {}).use(attrs, options.attrsOpts ?? {});
        this.#mdWithoutAttrs = new MarkdownIt(options.mdOpts ?? {});
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
        for (const ext of this.#extensions) {
            this.#md = ext.configureMd(this.#md);
            this.#mdWithoutAttrs = ext.configureMd(this.#mdWithoutAttrs);
            ext.nodes().forEach(this.processNode);
            ext.marks().forEach(this.processMark);
        }
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
        for (const ext of this.#extensions) {
            plugins.push(...ext.plugins(this.#deps));
            Object.assign(this.#actions, ext.actions(this.#deps));
        }

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
