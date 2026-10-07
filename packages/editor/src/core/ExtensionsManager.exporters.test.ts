import {Plugin} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';
import {Logger2} from '../logger';

import type {Extension, ExtensionDeps} from './ExtensionBuilder';
import {ExtensionsManager} from './ExtensionsManager';
import {SchemaDynamicModifier} from './SchemaDynamicModifier';
import type {Exporter, ExporterFactory} from './exporters/types';

describe('ExtensionsManager exporters', () => {
    it('should create an exporter with the final schema and logger without UI', () => {
        const logger = new Logger2();
        const create = vi.fn<ExporterFactory>((context) => ({
            export: () => context.schema.nodes.paragraph.create().attrs,
        }));
        const deps = new ExtensionsManager({
            logger,
            options: {
                exporters: [{name: 'attrs', create}],
                dynamicModifiers: {
                    schema: new SchemaDynamicModifier({paragraph: {allowedAttrs: ['dynamic']}}),
                },
            },
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).overrideNodeSpec('paragraph', (spec) => ({
                    ...spec,
                    attrs: {...spec.attrs, source: {default: 'override'}},
                })),
        }).buildDeps();
        const {getExporter} = deps;

        expect(create).toHaveBeenCalledExactlyOnceWith({schema: deps.schema, logger});
        expect(
            getExporter<Exporter<Record<string, unknown>>>('attrs').export(
                deps.schema.node('doc', null, [deps.schema.node('paragraph')]),
            ),
        ).toMatchObject({
            source: 'override',
            dynamic: null,
        });
    });

    it('should reject registrations before processing extensions', () => {
        const extensions = vi.fn<Extension>();
        const create = vi.fn<ExporterFactory>(() => ({export: () => 0}));

        expect(() =>
            new ExtensionsManager({
                extensions,
                options: {
                    exporters: [
                        {name: 'statistics', create},
                        {name: 'statistics', create},
                    ],
                },
            }).build(),
        ).toThrow('statistics');
        expect(extensions).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
    });

    it('should provide the same exporter to plugins, actions, and views', () => {
        const exporter: Exporter<number> = {export: (input) => input.childCount};
        const received: Exporter[] = [];
        const result = new ExtensionsManager({
            options: {exporters: [{name: 'statistics', create: () => exporter}]},
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .addPlugin(({getExporter}) => {
                        received.push(getExporter('statistics'));
                        return new Plugin({});
                    })
                    .addAction('statistics', ({getExporter}) => {
                        received.push(getExporter('statistics'));
                        return {isEnable: () => true, run: () => {}};
                    })
                    .addNodeView('paragraph', ({getExporter}) => {
                        received.push(getExporter('statistics'));
                        return () => ({dom: document.createElement('p')});
                    })
                    .addMarkSpec('emphasis', () => ({}))
                    .addMarkdownTokenParserSpec('em', () => ({type: 'mark', name: 'emphasis'}))
                    .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}))
                    .addMarkView('emphasis', ({getExporter}) => {
                        received.push(getExporter('statistics'));
                        return () => ({dom: document.createElement('em')});
                    }),
        }).build();

        expect(received).toEqual([exporter, exporter, exporter, exporter]);
        expect(result.getExporter('statistics')).toBe(exporter);
    });

    it('should stop before creating consumers when an exporter factory fails', () => {
        const consumer = vi.fn<(deps: ExtensionDeps) => Plugin | Plugin[]>(() => new Plugin({}));
        const create = vi.fn<ExporterFactory>(() => ({export: () => 0}));
        const build = () =>
            new ExtensionsManager({
                options: {
                    exporters: [
                        {name: 'first', create},
                        {
                            name: 'broken',
                            create: () => {
                                throw new Error('Invalid settings');
                            },
                        },
                        {name: 'last', create},
                    ],
                },
                extensions: (builder) => builder.use(BaseSchemaSpecs, {}).addPlugin(consumer),
            }).build();

        expect(build).toThrow('broken');
        expect(create).toHaveBeenCalledTimes(1);
        expect(consumer).not.toHaveBeenCalled();
    });
});
