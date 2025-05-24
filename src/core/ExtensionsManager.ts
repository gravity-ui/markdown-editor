import MarkdownIt, {type PresetName} from 'markdown-it';
import type {Schema} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import {Logger2} from '../logger';

import {ActionsManager} from './ActionsManager';
import {ExtensionBuilder} from './ExtensionBuilder';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import type {SchemaDynamicModifier} from './SchemaDynamicModifier';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import type {MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import type {MarkdownSerializerDynamicModifier} from './markdown/MarkdownSerializerDynamicModifier';
import type {TransformFn} from './markdown/ProseMirrorTransformer';
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
    logger?: Logger2.ILogger;
    extensions: Extension;
    options?: ExtensionsManagerOptions;
};

type ExtensionsManagerOptions = {
    mdOpts?: MarkdownIt.Options & {preset?: PresetName};
    linkifyTlds?: string | string[];
    pmTransformers?: TransformFn[];
    dynamicModifiers?: {
        parser?: MarkdownParserDynamicModifier;
        serializer?: MarkdownSerializerDynamicModifier;
        schema?: SchemaDynamicModifier;
    };
};

export class ExtensionsManager {
    static process(
        extensions: Extension,
        options: ExtensionsManagerOptions,
        logger?: Logger2.ILogger,
    ) {
        return new this({extensions, options, logger}).build();
    }

    #schemaRegistry;
    #parserRegistry;
    #serializerRegistry;

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

    constructor({extensions, options = {}, logger = new Logger2()}: ExtensionsManagerParams) {
        this.#schemaRegistry = new SchemaSpecRegistry(undefined, options.dynamicModifiers?.schema);
        this.#parserRegistry = new ParserTokensRegistry({logger});
        this.#serializerRegistry = new SerializerTokensRegistry();
        if (options.dynamicModifiers) {
            this.#parserDynamicModifier = options.dynamicModifiers?.parser;
            this.#serializerDynamicModifier = options.dynamicModifiers?.serializer;
        }

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
        this.#builder = new ExtensionBuilder(logger);
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

    private processNode = (name: string, {spec, fromMd, toMd, view}: ExtensionNodeSpec) => {
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

        const schema = this.#schemaRegistry.createSchema();
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
}
