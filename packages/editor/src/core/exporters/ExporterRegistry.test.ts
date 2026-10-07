import {Schema} from 'prosemirror-model';
import {describe, expect, it, vi} from 'vitest';

import {Logger2} from '../../logger';

import {ExporterRegistry} from './ExporterRegistry';
import type {Exporter, ExporterFactory} from './types';

describe('ExporterRegistry', () => {
    it('should reuse a named exporter for nodes and fragments', () => {
        const schema = createSchema();
        const exporter: Exporter<number> = {export: (input) => input.childCount};
        const create = vi.fn<ExporterFactory>(() => exporter);
        const registry = new ExporterRegistry([{name: 'statistics', create}], {
            schema,
            logger: new Logger2(),
        });
        const doc = schema.node('doc', null, [schema.node('paragraph')]);

        expect(registry.getExporter<Exporter<number>>('statistics').export(doc)).toBe(1);
        expect(registry.getExporter<Exporter<number>>('statistics').export(doc.content)).toBe(1);
        expect(registry.getExporter('statistics')).toBe(exporter);
        expect(create).toHaveBeenCalledTimes(1);
    });

    it.each([
        {name: '', error: 'Exporter name must be a non-empty string'},
        {name: 'statistics', error: 'Exporter "statistics" is already registered'},
    ])('should reject invalid name "$name" before any factory runs', ({name, error}) => {
        const create = vi.fn<ExporterFactory>(() => ({export: () => 0}));

        expect(
            () =>
                new ExporterRegistry(
                    [
                        {name: 'statistics', create},
                        {name, create},
                    ],
                    {schema: createSchema(), logger: new Logger2()},
                ),
        ).toThrow(error);
        expect(create).not.toHaveBeenCalled();
    });

    it('should report an unknown name in an empty registry', () => {
        const registry = new ExporterRegistry([], {schema: createSchema(), logger: new Logger2()});

        expect(() => registry.getExporter('missing')).toThrow('missing');
    });

    it.each([new Error('Invalid settings'), 'Invalid settings'])(
        'should preserve factory failure %s and stop creation',
        (cause) => {
            const nextCreate = vi.fn<ExporterFactory>(() => ({export: () => 0}));
            const createRegistry = () =>
                new ExporterRegistry(
                    [
                        {
                            name: 'broken',
                            create: () => {
                                throw cause;
                            },
                        },
                        {name: 'next', create: nextCreate},
                    ],
                    {schema: createSchema(), logger: new Logger2()},
                );

            expect(createRegistry).toThrow(
                expect.objectContaining({
                    message: 'Failed to create exporter "broken"',
                    cause,
                }),
            );
            expect(nextCreate).not.toHaveBeenCalled();
        },
    );

    it.each([null, undefined, {}, {export: true}])(
        'should reject a factory result without callable export: %j',
        (result: unknown) => {
            const create = () => result as Exporter;
            const nextCreate = vi.fn<ExporterFactory>(() => ({export: () => 0}));

            expect(
                () =>
                    new ExporterRegistry(
                        [
                            {name: 'invalid', create},
                            {name: 'next', create: nextCreate},
                        ],
                        {schema: createSchema(), logger: new Logger2()},
                    ),
            ).toThrow(
                new Error(
                    'Failed to create exporter "invalid": the export method must be callable',
                ),
            );
            expect(nextCreate).not.toHaveBeenCalled();
        },
    );

    it('should create exporters with different results in configuration order', () => {
        const schema = createSchema();
        const doc = schema.node('doc', null, [schema.node('paragraph')]);
        const order: string[] = [];
        const registry = new ExporterRegistry(
            [
                {
                    name: 'Statistics',
                    create: () => {
                        order.push('Statistics');
                        return {export: (input) => input.childCount};
                    },
                },
                {
                    name: 'statistics',
                    create: () => {
                        order.push('statistics');
                        return {export: () => 'text'};
                    },
                },
            ],
            {schema, logger: new Logger2()},
        );

        expect(order).toEqual(['Statistics', 'statistics']);
        expect(registry.getExporter<Exporter<number>>('Statistics').export(doc)).toBe(1);
        expect(registry.getExporter<Exporter<string>>('statistics').export(doc)).toBe('text');
    });

    it.each([' statistics ', ' ', '__proto__'])('should preserve the exact name "%s"', (name) => {
        const exporter: Exporter<number> = {export: () => 0};
        const registry = new ExporterRegistry([{name, create: () => exporter}], {
            schema: createSchema(),
            logger: new Logger2(),
        });

        expect(registry.getExporter(name)).toBe(exporter);
        expect(() => registry.getExporter('statistics')).toThrow('statistics');
    });

    it('should leave export errors to the exporter', () => {
        const cause = new Error('Invalid input');
        const schema = createSchema();
        const registry = new ExporterRegistry(
            [
                {
                    name: 'broken',
                    create: () => ({
                        export: () => {
                            throw cause;
                        },
                    }),
                },
            ],
            {schema, logger: new Logger2()},
        );
        const doc = schema.node('doc', null, [schema.node('paragraph')]);

        let received: unknown;
        try {
            registry.getExporter('broken').export(doc);
        } catch (error) {
            received = error;
        }
        expect(received).toBe(cause);
    });
});

function createSchema() {
    return new Schema({
        nodes: {doc: {content: 'paragraph+'}, paragraph: {content: 'text*'}, text: {}},
    });
}
