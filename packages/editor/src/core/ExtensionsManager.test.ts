import {EditorState, Plugin} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {BaseNode, BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';

import type {
    Extension,
    ExtensionDeps,
    ExtensionMarkSpec,
    ExtensionNodeSpec,
} from './ExtensionBuilder';
import {ExtensionsManager} from './ExtensionsManager';

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
