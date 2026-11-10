import type MarkdownIt from 'markdown-it';
import {EditorState, Plugin} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {BaseNode, BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';

import type {
    Extension,
    ExtensionDeps,
    ExtensionMarkSpec,
    ExtensionNodeSpec,
} from './ExtensionBuilder';
import {ExtensionsManager} from './ExtensionsManager';

const minimalSchema: Extension = (builder) => {
    builder
        .addNode('doc', () => ({
            spec: {content: 'block+'},
            fromMd: {tokenSpec: {name: 'doc', type: 'block', ignore: true}},
            toMd: () => {},
        }))
        .addNode('paragraph', () => ({
            spec: {group: 'block', content: 'inline*'},
            fromMd: {tokenSpec: {name: 'paragraph', type: 'block'}},
            toMd: () => {},
        }))
        .addNode('text', () => ({
            spec: {group: 'inline'},
            fromMd: {tokenSpec: {name: 'text', type: 'node', ignore: true}},
            toMd: () => {},
        }));
};

// Emits a token that belongs to no node and no mark — the shape of a yfm-lint token.
const lintTokenPlugin = (md: MarkdownIt) => {
    md.core.ruler.push('test_lint', (state) => {
        state.tokens.push(new state.Token('__test_lint', '', 0));
    });
    return md;
};

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

        expect(result.nodeViews[BaseNode.Paragraph]).toBe(nodeView);
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
                                nodeViews: {[BaseNode.Paragraph]: () => contentView('article')},
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

describe('ExtensionsManager parser-only tokens', () => {
    it('should register a parser-only token in the parser without a node in the schema', () => {
        const {schema, markupParser} = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(minimalSchema)
                    .configureMd(lintTokenPlugin)
                    .addMarkdownTokenParserSpec('__test_lint', () => ({
                        name: '__test_lint',
                        type: 'node',
                        ignore: true,
                    })),
        }).buildDeps();

        expect(schema.nodes['__test_lint']).toBeUndefined();
        // An unregistered token would make the parser throw
        expect(markupParser.parse('hello').textContent).toBe('hello');
    });

    it('should not add a schema node for an extra parser token', () => {
        const {schema, markupParser} = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(minimalSchema).addMarkdownTokenParserSpec('fence', () => ({
                    name: 'paragraph',
                    type: 'block',
                    noCloseToken: true,
                })),
        }).buildDeps();

        expect(schema.nodes['fence']).toBeUndefined();

        const doc = markupParser.parse('```\ncode\n```');
        expect(doc.firstChild!.type.name).toBe('paragraph');
        expect(doc.textContent.trim()).toBe('code');
    });
});

describe('ExtensionsManager parser aliases', () => {
    it('should parse multiple tokens into one node, keeping the alias out of the schema', () => {
        const tokenSpec: ExtensionNodeSpec['fromMd']['tokenSpec'] = {
            name: 'test_block',
            type: 'block',
            noCloseToken: true,
            prepareContent: (content) => content.trimEnd(),
        };
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder
                    .use(BaseSchemaSpecs, {})
                    .addMarkdownTokenParserSpec('code_block', () => tokenSpec)
                    .addMarkdownTokenParserSpec('fence', () => tokenSpec)
                    .addNodeSpec('test_block', () => ({group: 'block', content: 'text*'}))
                    .addNodeSerializerSpec('test_block', () => (state, node) => {
                        state.text(node.textContent, false);
                        state.closeBlock(node);
                    });
            },
        }).buildDeps();

        expect(result.schema.nodes.fence).toBeUndefined();
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

    it('should parse multiple tokens into one mark, keeping the alias out of the schema', () => {
        const tokenSpec: ExtensionMarkSpec['fromMd']['tokenSpec'] = {
            name: 'emphasis',
            type: 'mark',
        };
        const result = new ExtensionsManager({
            extensions: (builder) => {
                builder
                    .use(BaseSchemaSpecs, {})
                    .addMarkSpec('emphasis', () => ({}))
                    .addMarkdownTokenParserSpec('em', () => tokenSpec)
                    .addMarkdownTokenParserSpec('strong', () => tokenSpec)
                    .addMarkSerializerSpec('emphasis', () => ({open: '*', close: '*'}));
            },
        }).buildDeps();

        expect(result.schema.nodes.strong).toBeUndefined();
        expect(result.schema.marks.strong).toBeUndefined();
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

function viewExtensions(
    nodeView: NonNullable<ExtensionNodeSpec['view']>,
    markView: NonNullable<ExtensionMarkSpec['view']>,
): Extension {
    return (builder) => {
        builder
            .use(BaseSchemaSpecs, {})
            .addNodeView(BaseNode.Paragraph, nodeView)
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
