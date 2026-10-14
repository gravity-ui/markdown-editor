import MarkdownIt, {type PresetName} from 'markdown-it';
import type {Schema} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import {Logger2} from '../logger';

import {ActionsManager} from './ActionsManager';
import {ExtensionBuilder} from './ExtensionBuilder';
import type {Extension, ExtensionDeps, ExtensionSpec} from './ExtensionBuilder';
import {ParserTokensRegistry} from './ParserTokensRegistry';
import type {SchemaDynamicModifier} from './SchemaDynamicModifier';
import {SchemaSpecRegistry} from './SchemaSpecRegistry';
import {SerializerTokensRegistry} from './SerializerTokensRegistry';
import type {MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import type {MarkdownSerializerDynamicModifier} from './markdown/MarkdownSerializer';
import type {TransformFn} from './markdown/ProseMirrorTransformer';
import type {ActionSpec} from './types/actions';
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

    readonly #logger: Logger2.ILogger;

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
        this.#logger = logger;
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
        for (const [name, spec] of this.#spec.nodeSpecs) {
            this.#schemaRegistry.addNode(name, spec);
        }
        for (const [name, spec] of this.#spec.markSpecs) {
            this.#schemaRegistry.addMark(name, spec);
        }

        this.validateSpecs();

        for (const [name, spec] of this.#spec.parserSpecs) {
            this.#parserRegistry.addToken(name, spec);
        }
        for (const [name, spec] of this.#spec.nodeSerializers) {
            this.#serializerRegistry.addNode(name, spec);
        }
        for (const [name, spec] of this.#spec.markSerializers) {
            this.#serializerRegistry.addMark(name, spec);
        }
    }

    private createDeps() {
        const schema = this.#schemaRegistry.createSchema();
        const actions = new ActionsManager();
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

    private createParser(schema: Schema, mdInstance: MarkdownIt) {
        return this.#parserRegistry.createParser(
            schema,
            mdInstance,
            this.#pmTransformers,
            this.#parserDynamicModifier,
        );
    }

    private validateSpecs() {
        const parsedNodes = new Set<string>();
        const parsedMarks = new Set<string>();
        for (const [tokenName, spec] of this.#spec.parserSpecs) {
            if (spec.ignore) continue;
            const entityType = spec.type === 'mark' ? 'mark' : 'node';
            if (!this.hasSchemaEntity(spec.name, entityType)) {
                throw new Error(
                    `Parser spec "${tokenName}" targets unknown ${entityType} "${spec.name}"`,
                );
            }
            (entityType === 'mark' ? parsedMarks : parsedNodes).add(spec.name);
        }

        this.#spec = {
            ...this.#spec,
            nodeSerializers: this.filterSpecsBySchema(
                this.#spec.nodeSerializers,
                'node',
                'serializer',
            ),
            markSerializers: this.filterSpecsBySchema(
                this.#spec.markSerializers,
                'mark',
                'serializer',
            ),
            nodeViews: this.filterSpecsBySchema(this.#spec.nodeViews, 'node', 'view'),
            markViews: this.filterSpecsBySchema(this.#spec.markViews, 'mark', 'view'),
        };

        for (const name of this.#spec.nodeSpecs.keys()) {
            if (name === this.#schemaRegistry.topNodeName) continue;
            if (!this.#spec.nodeSerializers.has(name)) {
                throw new Error(`Missing serializer for node "${name}"`);
            }
            if (name !== 'text' && !parsedNodes.has(name)) {
                this.#logger.warn(`Missing parser spec for node "${name}"`);
            }
        }
        for (const name of this.#spec.markSpecs.keys()) {
            if (!this.#spec.markSerializers.has(name)) {
                throw new Error(`Missing serializer for mark "${name}"`);
            }
            if (!parsedMarks.has(name)) {
                this.#logger.warn(`Missing parser spec for mark "${name}"`);
            }
        }
    }

    private filterSpecsBySchema<T>(
        specs: ReadonlyMap<string, T>,
        entityType: 'node' | 'mark',
        specType: 'serializer' | 'view',
    ): ReadonlyMap<string, T> {
        const filtered = new Map<string, T>();
        for (const [name, spec] of specs) {
            if (this.hasSchemaEntity(name, entityType)) {
                filtered.set(name, spec);
            } else {
                this.#logger.warn(
                    `Skipping ${entityType} ${specType} "${name}": unknown ${entityType} "${name}"`,
                );
            }
        }
        return filtered;
    }

    private hasSchemaEntity(name: string, entityType: 'node' | 'mark'): boolean {
        return entityType === 'node'
            ? this.#schemaRegistry.hasNode(name)
            : this.#schemaRegistry.hasMark(name);
    }

    private createDerived() {
        this.#plugins = this.#spec.plugins(this.#deps);
        Object.assign(this.#actions, this.#spec.actions(this.#deps));

        for (const [name, view] of this.#spec.nodeViews) {
            this.#nodeViews[name] = view(this.#deps);
        }

        for (const [name, view] of this.#spec.markViews) {
            this.#markViews[name] = view(this.#deps);
        }
    }
}
