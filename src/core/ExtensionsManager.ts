import MarkdownIt from 'markdown-it';
import attrsPlugin, {AttrsOptions} from 'markdown-it-attrs'; // eslint-disable-line import/no-extraneous-dependencies
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
    mdOpts?: MarkdownIt.Options;
    attrsOpts?: {
        leftDelimiter?: string;
        rightDelimiter?: string;
        allowedAttributes?: string[];
    };
    linkifyTlds?: string | string[];
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

        this.#md = new MarkdownIt(options.mdOpts ?? {}).use<AttrsOptions>(
            attrsPlugin,
            options.attrsOpts ?? {},
        );
        this.#mdWithoutAttrs = new MarkdownIt(options.mdOpts ?? {});

        if (options.linkifyTlds) {
            this.#md.linkify.tlds(options.linkifyTlds, true);
            this.#mdWithoutAttrs.linkify.tlds(options.linkifyTlds, true);
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
        this.#md = this.#spec.configureMd(this.#md);
        this.#mdWithoutAttrs = this.#spec.configureMd(this.#mdWithoutAttrs);
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
