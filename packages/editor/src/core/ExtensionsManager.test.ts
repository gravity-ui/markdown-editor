import Token from 'markdown-it/lib/token';
import {EditorState, Plugin} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {Logger2} from '../logger';

import type {
    Extension,
    ExtensionBuilder,
    ExtensionDeps,
    MarkViewFactory,
    NodeViewFactory,
} from './ExtensionBuilder';
import {ExtensionsManager} from './ExtensionsManager';
import type {ParserToken} from './types/parser';

describe('ExtensionsManager views', () => {
    it('should call node and mark view factories with the built dependencies', () => {
        const receivedDeps: ExtensionDeps[] = [];
        const nodeView = () => contentView('section');
        const markView = () => contentView('i');
        const result = new ExtensionsManager({
            extensions: viewExtensions(
                (deps) => {
                    receivedDeps.push(deps);
                    return nodeView;
                },
                (deps) => {
                    receivedDeps.push(deps);
                    return markView;
                },
            ),
        }).build();

        expect(result.nodeViews['paragraph']).toBe(nodeView);
        expect(result.markViews.test_mark).toBe(markView);
        expect(receivedDeps).toHaveLength(2);
        for (const deps of receivedDeps) {
            expect(deps.schema).toBe(result.schema);
            expect(deps.markupParser).toBe(result.markupParser);
            expect(deps.textParser).toBe(result.textParser);
            expect(deps.serializer).toBe(result.serializer);
            expect(deps.actions).toBe(result.actions);
        }
    });

    it('should not call view factories when only building dependencies', () => {
        const factory = () => {
            throw new Error('View factory was called');
        };
        const result = new ExtensionsManager({
            extensions: viewExtensions(factory, factory),
        }).buildDeps();

        expect(result.markupParser.parse('*text*').textContent).toBe('text');
    });

    it('should keep registered views ahead of plugin views in the editor', () => {
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder.use(
                    viewExtensions(
                        () => () => contentView('section'),
                        () => () => contentView('i'),
                    ),
                );
                builder.addPlugin(
                    () =>
                        new Plugin({
                            props: {
                                nodeViews: {['paragraph']: () => contentView('article')},
                                markViews: {test_mark: () => contentView('strong')},
                            },
                        }),
                );
            },
        }).build();
        const view = new EditorView(null, {
            state: EditorState.create({
                schema: result.schema,
                doc: result.markupParser.parse('*text*'),
                plugins: result.plugins,
            }),
            nodeViews: result.nodeViews,
            markViews: result.markViews,
        });

        try {
            expect(view.dom.querySelector('section > i')?.textContent).toBe('text');
            expect(view.dom.querySelector('article, strong')).toBeNull();
        } finally {
            view.destroy();
        }
    });
});

describe('ExtensionsManager parser aliases', () => {
    it('should parse multiple tokens into one node without adding mark aliases', () => {
        const tokenSpec: ParserToken = {
            name: 'test_block',
            type: 'block',
            noCloseToken: true,
            prepareContent: (content) => content.trimEnd(),
        };
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder
                    .use(baseSpecs)
                    .addMarkdownTokenParserSpec('code_block', () => tokenSpec)
                    .addMarkdownTokenParserSpec('fence', () => tokenSpec)
                    .addNodeSpec('test_block', () => ({group: 'block', content: 'text*'}))
                    .addNodeSerializerSpec('test_block', () => (state, node) => {
                        state.text(node.textContent, false);
                        state.closeBlock(node);
                    });
            },
        }).buildDeps();

        expect(result.schema.marks.fence).toBeUndefined();
        for (const parser of ['markupParser', 'textParser'] as const) {
            for (const markup of ['    text\n', '```\ntext\n```']) {
                const doc = result[parser].parse(markup);
                expect(doc.firstChild?.type.name).toBe('test_block');
                expect(doc.firstChild?.textContent).toBe('text');
                expect(result.serializer.serialize(doc)).toBe('text');
            }
        }
    });

    it('should parse multiple tokens into one mark without adding node aliases', () => {
        const tokenSpec: ParserToken = {
            name: 'emphasis',
            type: 'mark',
        };
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder
                    .use(baseSpecs)
                    .addMarkSpec('emphasis', () => ({}))
                    .addMarkdownTokenParserSpec('em', () => tokenSpec)
                    .addMarkdownTokenParserSpec('strong', () => tokenSpec)
                    .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}));
            },
        }).buildDeps();

        expect(result.schema.nodes.strong).toBeUndefined();
        for (const parser of ['markupParser', 'textParser'] as const) {
            for (const markup of ['*text*', '**text**']) {
                const doc = result[parser].parse(markup);
                expect(doc.firstChild?.firstChild?.marks.map((mark) => mark.type.name)).toEqual([
                    'emphasis',
                ]);
                expect(result.serializer.serialize(doc)).toBe('*text*');
            }
        }
    });
});

describe('ExtensionsManager schema order', () => {
    it('preserves mark priorities and equal-priority registration order', () => {
        const {schema} = buildWith((builder) => {
            builder
                .addMarkSpec('low', () => ({}), 0)
                .addMarkSpec('first', () => ({}), 10)
                .addMarkSpec('high', () => ({}), 100)
                .addMarkSpec('second', () => ({}), 10);
            for (const name of ['low', 'first', 'high', 'second']) {
                builder.addMarkSerializerSpec(name, () => ({open: '*', close: '*'}));
            }
        });
        expect(Object.keys(schema.marks)).toEqual(['high', 'first', 'second', 'low']);
    });
});

describe('ExtensionsManager spec validation', () => {
    it('validates parser references before compiling the schema', () => {
        expect(() =>
            buildWith((builder) => {
                builder
                    .overrideNodeSpec('doc', (prev) => ({...prev, content: 'unknown_group'}))
                    .addMarkdownTokenParserSpec('invalid', () => ({name: 'missing', type: 'node'}));
            }),
        ).toThrow('Parser spec "invalid" targets unknown node "missing"');
    });

    it('lets ProseMirror reject an invalid schema after validating the specs', () => {
        expect(() =>
            buildWith((builder) => {
                builder.overrideNodeSpec('doc', (prev) => ({...prev, content: 'unknown_group'}));
            }),
        ).toThrow("No node type or group 'unknown_group' found");
    });

    it.each([
        ['missing node', 'node', 'missing'],
        ['missing block', 'block', 'missing'],
        ['missing mark', 'mark', 'missing'],
        ['node used as mark', 'mark', 'paragraph'],
        ['mark used as node', 'node', 'emphasis'],
        ['mark used as block', 'block', 'emphasis'],
    ] as const)('rejects a parser targeting a %s', (_, type, name) => {
        expect(() =>
            buildWith((builder) => {
                builder
                    .addMarkSpec('emphasis', () => ({}))
                    .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}))
                    .addMarkdownTokenParserSpec('invalid', () => ({type, name}));
            }),
        ).toThrow(
            `Parser spec "invalid" targets unknown ${type === 'mark' ? 'mark' : 'node'} "${name}"`,
        );
    });

    it.each([
        [
            'node serializer',
            'node',
            (builder) =>
                builder.addNodeSerializerSpec('missing', () => () => {
                    throw new Error('Unexpected serializer call');
                }),
        ],
        [
            'mark serializer',
            'mark',
            (builder) => builder.addMarkSerializerSpec('missing', () => ({open: '*', close: '*'})),
        ],
        [
            'node view',
            'node',
            (builder) =>
                builder.addNodeView('missing', () => {
                    throw new Error('Unexpected view factory call');
                }),
        ],
        [
            'mark view',
            'mark',
            (builder) =>
                builder.addMarkView('missing', () => {
                    throw new Error('Unexpected view factory call');
                }),
        ],
    ] satisfies [string, string, Extension][])(
        'skips a %s without a schema entity and warns',
        (label, type, extension) => {
            const {result, warnings} = buildWithWarnings(extension);
            expect(warnings).toEqual([`Skipping ${label} "missing": unknown ${type} "missing"`]);
            expect(result.nodeViews).toEqual({});
            expect(result.markViews).toEqual({});
            expect(result.serializer.serialize(result.textParser.parse('text'))).toBe('text');
        },
    );

    it.each([
        [
            'node serializer',
            'node',
            'emphasis',
            (builder) => builder.addNodeSerializerSpec('emphasis', () => () => {}),
        ],
        [
            'mark serializer',
            'mark',
            'paragraph',
            (builder) => builder.addMarkSerializerSpec('paragraph', () => ({open: '', close: ''})),
        ],
        [
            'node view',
            'node',
            'emphasis',
            (builder) =>
                builder.addNodeView('emphasis', () => {
                    throw new Error('Unexpected view factory call');
                }),
        ],
        [
            'mark view',
            'mark',
            'paragraph',
            (builder) =>
                builder.addMarkView('paragraph', () => {
                    throw new Error('Unexpected view factory call');
                }),
        ],
    ] satisfies [string, string, string, Extension][])(
        'skips a %s targeting the wrong schema type and warns',
        (label, type, name, extension) => {
            const {result, warnings} = buildWithWarnings((builder) => {
                builder
                    .addMarkSpec('emphasis', () => ({}))
                    .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}))
                    .addMarkdownTokenParserSpec('em', () => ({name: 'emphasis', type: 'mark'}))
                    .use(extension);
            });
            expect(warnings).toEqual([`Skipping ${label} "${name}": unknown ${type} "${name}"`]);
            expect(result.nodeViews).toEqual({});
            expect(result.markViews).toEqual({});
            expect(result.serializer.serialize(result.textParser.parse('*text*'))).toBe('*text*');
        },
    );

    it('requires a node serializer', () => {
        expect(() =>
            buildWith((builder) => {
                builder.addNodeSpec('custom', () => ({group: 'block'}));
            }),
        ).toThrow('Missing serializer for node "custom"');
    });

    it('requires a mark serializer', () => {
        expect(() =>
            buildWith((builder) => {
                builder.addMarkSpec('custom', () => ({}));
            }),
        ).toThrow('Missing serializer for mark "custom"');
    });

    it('requires a text serializer', () => {
        expect(() =>
            new ExtensionsManager({
                extensions: (builder) => {
                    builder
                        .addNodeSpec('doc', () => ({content: 'text*'}))
                        .addNodeSpec('text', () => ({}));
                },
            }).buildDeps(),
        ).toThrow('Missing serializer for node "text"');
    });

    it('ignores tokens without a schema entity or serializer', () => {
        const result = buildWith((builder) =>
            builder.addMarkdownTokenParserSpec('__ignored', () => ({
                name: '__ignored',
                type: 'node',
                ignore: true,
            })),
        );
        const token = new Token('__ignored', '', 0);
        expect(result.schema.nodes.__ignored).toBeUndefined();
        expect(result.schema.marks.__ignored).toBeUndefined();
        for (const parser of [result.textParser, result.markupParser]) {
            const doc = parser.parse([token]);
            expect(result.serializer.serialize(doc)).toBe('');
        }
    });

    it('validates the final parser target after overrides', () => {
        const result = buildWith((builder) => {
            builder
                .addMarkdownTokenParserSpec('alias', () => ({name: 'missing', type: 'mark'}))
                .overrideMarkdownTokenParserSpec('alias', () => ({
                    name: 'paragraph',
                    type: 'block',
                }));
        });
        expect(result.schema.nodes.alias).toBeUndefined();
    });

    it('rejects an invalid final parser target after overrides', () => {
        expect(() =>
            buildWith((builder) => {
                builder.overrideMarkdownTokenParserSpec('paragraph', (prev) => ({
                    ...prev,
                    name: 'missing',
                }));
            }),
        ).toThrow('Parser spec "paragraph" targets unknown node "missing"');
    });

    it('allows views registered before their schema specs', () => {
        const nodeView = () => contentView('section');
        const markView = () => contentView('em');
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder
                    .addNodeView('paragraph', () => nodeView)
                    .addMarkView('custom', () => markView)
                    .use(baseSpecs)
                    .addMarkSpec('custom', () => ({}))
                    .addMarkSerializerSpec('custom', () => ({open: '*', close: '*'}));
            },
        }).build();
        expect(result.nodeViews['paragraph']).toBe(nodeView);
        expect(result.markViews.custom).toBe(markView);
    });
});

describe('ExtensionsManager parser warnings', () => {
    it('does not warn for root and text nodes', () => {
        const {warnings, result} = buildWithWarnings(() => {});
        expect(warnings).toEqual([]);
        expect(result.serializer.serialize(result.textParser.parse('text'))).toBe('text');
    });

    it('warns once for each schema entity without a parser', () => {
        const {warnings} = buildWithWarnings((builder) => {
            builder
                .addNodeSpec('custom', () => ({group: 'block'}))
                .addNodeSerializerSpec('custom', () => () => {})
                .addMarkSpec('emphasis', () => ({}))
                .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}));
        });
        expect(warnings).toEqual([
            'Missing parser spec for node "custom"',
            'Missing parser spec for mark "emphasis"',
        ]);
    });

    it('counts aliases by their final target', () => {
        const {warnings} = buildWithWarnings((builder) => {
            builder
                .addMarkSpec('emphasis', () => ({}))
                .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}))
                .addMarkdownTokenParserSpec('alias', () => ({name: 'missing', type: 'node'}))
                .overrideMarkdownTokenParserSpec('alias', () => ({name: 'emphasis', type: 'mark'}))
                .addMarkdownTokenParserSpec('second_alias', () => ({
                    name: 'emphasis',
                    type: 'mark',
                }));
        });
        expect(warnings).toEqual([]);
    });

    it('does not count an ignored parser as a parser for its target', () => {
        const {warnings} = buildWithWarnings((builder) => {
            builder.overrideMarkdownTokenParserSpec('paragraph', (prev) => ({
                ...prev,
                ignore: true,
            }));
        });
        expect(warnings).toEqual(['Missing parser spec for node "paragraph"']);
    });
});

function buildWith(extension: Extension, logger = new Logger2()) {
    return new ExtensionsManager({
        logger,
        extensions: (builder) => builder.use(baseSpecs).use(extension),
    }).build();
}

function buildWithWarnings(extension: Extension) {
    const warnings: string[] = [];
    const logger = new Logger2();
    logger.on('warn', ({msg}) => warnings.push(msg));
    const result = buildWith(extension, logger);
    return {warnings, result};
}

function viewExtensions(nodeView: NodeViewFactory, markView: MarkViewFactory): Extension {
    return (builder) => {
        builder
            .use(baseSpecs)
            .addNodeView('paragraph', nodeView)
            .addMarkSpec('test_mark', () => ({toDOM: () => ['em', 0]}))
            .addMarkdownTokenParserSpec('em', () => ({type: 'mark', name: 'test_mark'}))
            .addMarkSerializerSpec('test_mark', () => ({open: '*', close: '*'}))
            .addMarkView('test_mark', markView);
    };
}

function contentView(tag: string) {
    const dom = document.createElement(tag);
    return {dom, contentDOM: dom};
}

function baseSpecs(builder: ExtensionBuilder): void {
    builder
        .addNodeSpec('doc', () => ({content: 'block+'}))
        .addNodeSpec('text', () => ({group: 'inline'}))
        .addNodeSpec('paragraph', () => ({
            group: 'block',
            content: 'inline*',
            toDOM: () => ['p', 0],
        }))
        .addMarkdownTokenParserSpec('paragraph', () => ({name: 'paragraph', type: 'block'}))
        .addNodeSerializerSpec('text', () => (state, node) => state.text(node.text || ''))
        .addNodeSerializerSpec('paragraph', () => (state, node) => {
            state.renderInline(node);
            state.closeBlock(node);
        });
}
