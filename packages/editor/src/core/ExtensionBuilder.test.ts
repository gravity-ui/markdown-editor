import MarkdownIt from 'markdown-it';
import {type MarkSpec, type NodeSpec, Schema} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {Logger2} from '../logger';

import {ExtensionBuilder, type ExtensionDeps, type ExtensionSpec} from './ExtensionBuilder';
import {MarkdownSerializer} from './markdown/MarkdownSerializer';

const logger = new Logger2().nested({env: 'test'});

describe('ExtensionBuilder', () => {
    it('builds a schema spec without a parser or serializer', () => {
        const spec = new ExtensionBuilder(new Logger2())
            .addNodeSpec('block', () => ({group: 'block'}))
            .build();

        expect(spec.nodeSpecs.get('block')).toEqual({group: 'block'});
        expect(spec.parserSpecs.size).toBe(0);
        expect(spec.nodeSerializers.size).toBe(0);
    });

    it('resolves parser callbacks once during build', () => {
        const calls: string[] = [];
        const builder = new ExtensionBuilder(new Logger2())
            .addMarkdownTokenParserSpec('lint', () => {
                calls.push('add');
                return {name: 'lint', type: 'node', ignore: true};
            })
            .overrideMarkdownTokenParserSpec('lint', (prev) => {
                calls.push('override');
                return {...prev, name: 'ignored'};
            });

        expect(calls).toEqual([]);
        const spec = builder.build();
        expect(calls).toEqual(['add', 'override']);
        expect(spec.parserSpecs.get('lint')?.name).toBe('ignored');
        expect(spec.nodeSpecs.size).toBe(0);
        expect(spec.markSpecs.size).toBe(0);
    });

    it('keeps earlier build collections unchanged', () => {
        const builder = new ExtensionBuilder(new Logger2()).addNodeSpec('a', () => ({}));
        const first = builder.build();
        builder.addNodeSpec('b', () => ({}));
        const second = builder.build();

        expect([...first.nodeSpecs.keys()]).toEqual(['a']);
        expect([...second.nodeSpecs.keys()]).toEqual(['a', 'b']);
    });

    it('sorts marks without changing override order', () => {
        const changes: string[] = [];
        const spec = new ExtensionBuilder(new Logger2())
            .addMarkSpec('low', () => ({}), 0)
            .addMarkSpec('first', () => ({}), 10)
            .addMarkSpec('second', () => ({}), 10)
            .overrideMarkSpec('low', (prev) => {
                changes.push('first');
                return {...prev, inclusive: false};
            })
            .overrideMarkSpec('low', (prev) => {
                changes.push('second');
                return {...prev, excludes: ''};
            })
            .build();

        expect([...spec.markSpecs.keys()]).toEqual(['first', 'second', 'low']);
        expect(spec.markSpecs.get('low')).toEqual({inclusive: false, excludes: ''});
        expect(changes).toEqual(['first', 'second']);
    });

    it('allows views before schema specs without calling their factories', () => {
        const factory = () => {
            throw new Error('View factory must stay deferred');
        };
        const spec = new ExtensionBuilder(new Logger2())
            .addNodeView('node', factory)
            .addMarkView('mark', factory)
            .addNodeSpec('node', () => ({}))
            .addMarkSpec('mark', () => ({}))
            .build();

        expect(spec.nodeViews.get('node')).toBe(factory);
        expect(spec.markViews.get('mark')).toBe(factory);
    });

    it('keeps schema callbacks independent for matching names', () => {
        const node: NodeSpec = {group: 'block'};
        const mark: MarkSpec = {inclusive: false};
        const spec = new ExtensionBuilder(new Logger2())
            .addNodeSpec('same', () => node)
            .addMarkSpec('same', () => mark)
            .build();

        expect(spec.nodeSpecs.get('same')).toBe(node);
        expect(spec.markSpecs.get('same')).toBe(mark);
    });
    it('should add plugins', () => {
        const plugins = new ExtensionBuilder(logger)
            .addPlugin(() => new Plugin({}))
            .addPlugin(() => new Plugin({}))
            .build()
            .plugins({} as ExtensionDeps);

        expect(plugins.length).toBe(2);
    });

    it('should sort plugins by priority', () => {
        const plugin0 = new Plugin({});
        const plugin1 = new Plugin({});
        const plugin2 = new Plugin({});
        const plugin3 = new Plugin({});
        const plugins = new ExtensionBuilder(logger)
            .addPlugin(() => plugin3, ExtensionBuilder.Priority.VeryLow)
            .addPlugin(() => plugin1)
            .addPlugin(() => plugin0, ExtensionBuilder.Priority.VeryHigh)
            .addPlugin(() => plugin2)
            .build()
            .plugins({} as ExtensionDeps);

        expect(plugins.indexOf(plugin0)).toBe(0);
        expect(plugins.indexOf(plugin1)).toBe(1);
        expect(plugins.indexOf(plugin2)).toBe(2);
        expect(plugins.indexOf(plugin3)).toBe(3);
    });

    it('should add actions', () => {
        const actions = new ExtensionBuilder(logger)
            .addAction('action1', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }))
            .addAction('action2', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }))
            .build()
            .actions({} as ExtensionDeps);

        expect(Object.keys(actions).length).toBe(2);
        expect('action1' in actions).toBe(true);
        expect('action2' in actions).toBe(true);
    });

    it('should throw error when add actions with the same names', () => {
        const builder = new ExtensionBuilder(logger).addAction('action', () => ({
            isActive: () => false,
            isEnable: () => false,
            run() {},
        }));

        const fn = () => {
            builder.addAction('action', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }));
        };

        expect(fn).toThrow(Error);
    });

    it('calls extensions immediately with their options', () => {
        const builder = new ExtensionBuilder(logger);
        const options = {enabled: true};
        const calls: unknown[] = [];
        builder.use((receivedBuilder, receivedOptions) => {
            calls.push(receivedBuilder, receivedOptions);
        }, options);
        expect(calls).toEqual([builder, options]);
    });

    it('builds empty collections and derived values', () => {
        const spec = new ExtensionBuilder(logger).build();
        expect([
            spec.nodeSpecs.size,
            spec.markSpecs.size,
            spec.parserSpecs.size,
            spec.nodeSerializers.size,
            spec.markSerializers.size,
            spec.nodeViews.size,
            spec.markViews.size,
        ]).toEqual([0, 0, 0, 0, 0, 0, 0]);
        expect(spec.plugins({} as ExtensionDeps)).toEqual([]);
        expect(spec.actions({} as ExtensionDeps)).toEqual({});
    });

    it('checks schema registration without executing callbacks', () => {
        const builder = new ExtensionBuilder(logger);
        expect(builder.hasNodeSpec('node')).toBe(false);
        expect(builder.hasMarkSpec('mark')).toBe(false);
        const factory = () => {
            throw new Error('Must stay deferred');
        };
        builder.addNodeSpec('node', factory).addMarkSpec('mark', factory);
        expect(builder.hasNodeSpec('node')).toBe(true);
        expect(builder.hasMarkSpec('mark')).toBe(true);
        expect(builder.hasNodeSpec('mark')).toBe(false);
        expect(builder.hasMarkSpec('node')).toBe(false);
    });

    it.each(['node', 'mark'] as const)('rejects duplicate %s views', (type) => {
        const builder = new ExtensionBuilder(logger);
        const factory = () => {
            throw new Error('Must stay deferred');
        };
        const add = () =>
            type === 'node'
                ? builder.addNodeView('view', factory)
                : builder.addMarkView('view', factory);
        add();
        expect(add).toThrow('view for "view" is already registered');
    });

    it('preserves view collections across builds', () => {
        const factory = () => {
            throw new Error('Must stay deferred');
        };
        const builder = new ExtensionBuilder(logger).addNodeView('first', factory);
        const first = builder.build();
        builder.addNodeView('second', factory).addMarkView('mark', factory);
        const second = builder.build();
        expect([...first.nodeViews.keys()]).toEqual(['first']);
        expect(first.markViews.size).toBe(0);
        expect([...second.nodeViews.keys()]).toEqual(['first', 'second']);
        expect([...second.markViews.keys()]).toEqual(['mark']);
    });

    it('configures the selected Markdown parser in registration order', () => {
        const spec = new ExtensionBuilder(logger)
            .configureMd((md) => md.set({html: true}))
            .configureMd((md) => md.set({html: false}), {text: false})
            .configureMd((md) => md.set({breaks: true}), {markup: false})
            .build();
        const text = spec.configureMd(new MarkdownIt(), 'text');
        const markup = spec.configureMd(new MarkdownIt(), 'markup');
        expect(text.options).toMatchObject({html: true, breaks: true});
        expect(markup.options).toMatchObject({html: false, breaks: false});
    });

    it('chains node serializer overrides in registration order', () => {
        const spec = new ExtensionBuilder(logger)
            .addNodeSerializerSpec('entry', () => (state) => state.write('initial'))
            .overrideNodeSerializerSpec('entry', (prev) => (state, ...args) => {
                state.write('[');
                prev(state, ...args);
                state.write(']');
            })
            .overrideNodeSerializerSpec('entry', (prev) => (state, ...args) => {
                state.write('(');
                prev(state, ...args);
                state.write(')');
            })
            .build();
        expect(serializeEntry(spec)).toBe('([initial])');
    });

    it('runs callbacks once per build in each independent collection', () => {
        const calls: string[] = [];
        const builder = new ExtensionBuilder(logger)
            .addNodeSpec('node', () => {
                calls.push('node');
                return {};
            })
            .addMarkSpec('mark', () => {
                calls.push('mark');
                return {};
            })
            .addNodeSerializerSpec('node', () => {
                calls.push('node serializer');
                return () => {};
            })
            .addMarkSerializerSpec('mark', () => {
                calls.push('mark serializer');
                return {open: '*', close: '*'};
            });
        expect(calls).toEqual([]);
        builder.build();
        expect(calls).toEqual(['node', 'mark', 'node serializer', 'mark serializer']);
        builder.build();
        expect(calls).toEqual([
            'node',
            'mark',
            'node serializer',
            'mark serializer',
            'node',
            'mark',
            'node serializer',
            'mark serializer',
        ]);
    });

    it('preserves node order after overrides', () => {
        const spec = new ExtensionBuilder(logger)
            .addNodeSpec('a', () => ({}))
            .addNodeSpec('b', () => ({}))
            .overrideNodeSpec('a', () => ({group: 'block'}))
            .build();
        expect([...spec.nodeSpecs.keys()]).toEqual(['a', 'b']);
    });
});

describe.each([
    {
        name: 'node spec',
        add: (builder) => builder.addNodeSpec('entry', () => ({attrs: {initial: {default: true}}})),
        override: (builder) =>
            builder.overrideNodeSpec('entry', (prev) => ({
                ...prev,
                attrs: {...prev.attrs, updated: {default: true}},
            })),
        read: (spec) => spec.nodeSpecs.get('entry')?.attrs,
        expected: {initial: {default: true}, updated: {default: true}},
    },
    {
        name: 'mark spec',
        add: (builder) => builder.addMarkSpec('entry', () => ({attrs: {initial: {default: true}}})),
        override: (builder) =>
            builder.overrideMarkSpec('entry', (prev) => ({
                ...prev,
                attrs: {...prev.attrs, updated: {default: true}},
            })),
        read: (spec) => spec.markSpecs.get('entry')?.attrs,
        expected: {initial: {default: true}, updated: {default: true}},
    },
    {
        name: 'parser spec',
        add: (builder) =>
            builder.addMarkdownTokenParserSpec('entry', () => ({name: 'target', type: 'node'})),
        override: (builder) =>
            builder.overrideMarkdownTokenParserSpec('entry', (prev) => ({
                ...prev,
                name: prev.name + '!',
            })),
        read: (spec) => spec.parserSpecs.get('entry')?.name,
        expected: 'target!',
    },
    {
        name: 'node serializer',
        add: (builder) =>
            builder.addNodeSerializerSpec('entry', () => (state) => state.write('initial')),
        override: (builder) =>
            builder.overrideNodeSerializerSpec('entry', (prev) => (state, ...args) => {
                prev(state, ...args);
                state.write('!');
            }),
        read: serializeEntry,
        expected: 'initial!',
    },
    {
        name: 'mark serializer',
        add: (builder) => builder.addMarkSerializerSpec('entry', () => ({open: '*', close: '*'})),
        override: (builder) =>
            builder.overrideMarkSerializerSpec('entry', (prev) => ({
                ...prev,
                open: prev.open + '!',
            })),
        read: (spec) => spec.markSerializers.get('entry')?.open,
        expected: '*!',
    },
] satisfies RegistryTestCase[])('$name registration', ({add, override, read, expected}) => {
    it('rejects duplicate entries', () => {
        const builder = new ExtensionBuilder(logger);
        add(builder);
        expect(() => add(builder)).toThrow('"entry" is already registered');
    });

    it('rejects an override before registration', () => {
        expect(() => override(new ExtensionBuilder(logger))).toThrow('"entry": not registered');
    });

    it('applies an override to the previous result', () => {
        const builder = new ExtensionBuilder(logger);
        add(builder);
        override(builder);
        expect(read(builder.build())).toEqual(expected);
    });
});

function serializeEntry(spec: ExtensionSpec): string {
    const schema = new Schema({
        nodes: {
            doc: {content: 'entry'},
            entry: {},
            text: {},
        },
    });
    const serializer = new MarkdownSerializer(Object.fromEntries(spec.nodeSerializers), {});
    return serializer.serialize(schema.node('doc', null, schema.node('entry')));
}

type RegistryTestCase = {
    name: string;
    add: (builder: ExtensionBuilder) => void;
    override: (builder: ExtensionBuilder) => void;
    read: (spec: ExtensionSpec) => unknown;
    expected: unknown;
};
