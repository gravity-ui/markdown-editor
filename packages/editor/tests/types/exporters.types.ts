// Type tests run with pnpm typecheck.
import type {Fragment, Node, Schema} from 'prosemirror-model';

import type * as PublicPackage from '../../src';
import type * as Core from '../../src/core';

interface TextExporter extends Core.Exporter<string> {
    clearCache(): void;
    export(input: Node | Fragment): string;
    export(input: Node | Fragment, options: {pretty: true}): string;
}

export function shouldPreserveConcreteExporter(
    storage: Core.ExporterStorage,
    input: Node | Fragment,
) {
    const exporter = storage.getExporter<TextExporter>('text');
    const result: string = exporter.export(input);
    const formatted: string = exporter.export(input, {pretty: true});
    exporter.clearCache();

    // @ts-expect-error Export input must be a ProseMirror node or fragment.
    exporter.export('text');

    // @ts-expect-error The concrete exporter returns a string.
    const invalidResult: number = exporter.export(input);

    return {result, formatted, invalidResult};
}

export function shouldUseReadonlyFactoryContext(context: Core.ExporterFactoryContext) {
    const schema: Schema = context.schema;
    const logger: PublicPackage.Logger2.ILogger = context.logger;
    const factoryContext: Core.ExporterFactoryContext = {schema, logger};

    // @ts-expect-error The schema field is read-only.
    factoryContext.schema = schema;
    // @ts-expect-error The logger field is read-only.
    factoryContext.logger = logger;

    return {schema, logger};
}

export function shouldRegisterDifferentExporterResults() {
    const createStatistics: Core.ExporterFactory = ({schema, logger}) => ({
        export(input) {
            logger.log(schema.topNodeType.name);
            return {childCount: input.childCount};
        },
    });
    const statistics: Core.ExporterRegistration = {name: 'statistics', create: createStatistics};
    const text: Core.ExporterRegistration = {name: 'text', create: () => ({export: () => 'text'})};
    const registrations: readonly PublicPackage.ExporterRegistration[] = [statistics, text];
    const options: Core.WysiwygEditorOptions = {exporters: registrations};

    // @ts-expect-error Registration names are read-only.
    statistics.name = 'changed';
    // @ts-expect-error Registration factories are read-only.
    statistics.create = text.create;

    return options;
}

export function shouldPreserveObjectResults(
    storage: Core.ExporterStorage,
    node: Node,
    fragment: Fragment,
) {
    const exporter = storage.getExporter<Core.Exporter<{childCount: number}>>('statistics');
    const nodeResult: number = exporter.export(node).childCount;
    const fragmentResult: number = exporter.export(fragment).childCount;

    // @ts-expect-error Core does not add universal export options.
    exporter.export(node, {format: 'text'});

    return {nodeResult, fragmentResult};
}

export function shouldRequireEditorLookup(editor: Core.WysiwygEditor) {
    const storage: Core.ExporterStorage = editor;
    const publicStorage: PublicPackage.ExporterStorage = editor;

    return {storage, publicStorage};
}

export function shouldAcceptLegacyExtensionDeps(
    schema: Schema,
    textParser: Core.Parser,
    markupParser: Core.Parser,
    serializer: Core.Serializer,
    actions: Core.ActionStorage,
) {
    const legacyDeps = {schema, textParser, markupParser, serializer, actions};
    const deps: Core.ExtensionDeps = legacyDeps;
    const publicDeps: PublicPackage.ExtensionDeps = legacyDeps;

    return {deps, publicDeps};
}

export function shouldPreserveConditionalExporterLookup(
    deps: Core.ExtensionDeps,
    input: Node | Fragment,
) {
    const publicDeps: PublicPackage.ExtensionDeps = deps;
    const {getExporter} = publicDeps;

    // @ts-expect-error Extension dependencies may omit the exporter lookup.
    getExporter<TextExporter>('text');

    if (!getExporter) return undefined;

    const exporter: TextExporter = getExporter<TextExporter>('text');
    const result: string = exporter.export(input);
    const formatted: string = exporter.export(input, {pretty: true});
    exporter.clearCache();

    // @ts-expect-error The concrete exporter returns a string.
    const invalidResult: number = exporter.export(input);

    return {result, formatted, invalidResult};
}

export type PackageExporterContracts = {
    exporter: PublicPackage.Exporter;
    factory: PublicPackage.ExporterFactory;
    context: PublicPackage.ExporterFactoryContext;
    registration: PublicPackage.ExporterRegistration;
    storage: PublicPackage.ExporterStorage;
};

type AssertFalse<Value extends false> = Value;

export type PublicScopeContracts = [
    AssertFalse<'ExporterRegistry' extends keyof typeof Core ? true : false>,
    AssertFalse<'ExporterRegistry' extends keyof typeof PublicPackage ? true : false>,
    AssertFalse<'exporters' extends keyof PublicPackage.MarkdownEditorOptions ? true : false>,
    AssertFalse<'exporters' extends keyof PublicPackage.MarkdownEditorWysiwygConfig ? true : false>,
    AssertFalse<'getExporter' extends keyof PublicPackage.MarkdownEditorInstance ? true : false>,
    AssertFalse<
        'exporters' extends keyof Parameters<typeof PublicPackage.useMarkdownEditor>[0]
            ? true
            : false
    >,
    AssertFalse<
        'getExporter' extends keyof ReturnType<typeof PublicPackage.useMarkdownEditor>
            ? true
            : false
    >,
];
