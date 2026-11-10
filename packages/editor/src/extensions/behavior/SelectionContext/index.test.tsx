import {ThemeProvider} from '@gravity-ui/uikit';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../core';
import {ReactRenderStorage, ReactRendererComponent} from '../../../modules/react-renderer';
import {ToolbarDataType} from '../../../toolbar';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {ReactRendererExtension} from '../ReactRenderer';

import {SelectionContext, type SelectionContextConfig} from './index';

describe('selection toolbar visibility', () => {
    let view: EditorView;
    let root: Root;
    let editorContainer: HTMLDivElement;
    let rendererContainer: HTMLDivElement;
    let from: number;
    let visibleTo: number;
    let hiddenTo: number;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    });

    afterEach(async () => {
        await act(async () => {
            view.destroy();
            root.unmount();
        });
        editorContainer.remove();
        rendererContainer.remove();
        vi.unstubAllGlobals();
    });

    async function mountEditor(config: SelectionContextConfig) {
        const storage = new ReactRenderStorage();
        const deps = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(ReactRendererExtension, storage)
                    .use(SelectionContext, {config}),
        }).build();
        const {doc, p} = builders(deps.schema, {p: {nodeType: BaseNode.Paragraph}});
        const documentNode = doc(p('<from>visible<visibleTo> hidden<hiddenTo>'));
        ({from, visibleTo, hiddenTo} = documentNode.tag);
        editorContainer = document.createElement('div');
        rendererContainer = document.createElement('div');
        document.body.append(editorContainer, rendererContainer);
        root = createRoot(rendererContainer);
        view = new EditorView(editorContainer, {
            state: EditorState.create({
                schema: deps.schema,
                doc: documentNode,
                plugins: deps.plugins,
            }),
        });

        await act(async () => {
            root.render(
                <ThemeProvider>
                    <ReactRendererComponent storage={storage} />
                </ThemeProvider>,
            );
            view.focus();
        });
    }

    async function selectText(to: number) {
        await act(async () => {
            view.dispatch(
                view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)),
            );
        });
    }

    function getToolbar() {
        return document.querySelector('[data-qa="g-md-toolbar-selection"]');
    }

    async function handleEscape() {
        let handled = false;
        await act(async () => {
            handled = Boolean(
                view.someProp('handleKeyDown', (handler) =>
                    handler(view, new KeyboardEvent('keydown', {key: 'Escape'})),
                ),
            );
        });
        return handled;
    }

    it.each(['condition', 'enabled'] as const)(
        'should pass Escape through when all toolbar items are hidden by %s',
        async (visibilityRule) => {
            const condition = vi.fn(() => false);
            const isEnable = vi.fn(() => false);
            await mountEditor([
                [
                    {
                        id: 'hidden-action',
                        type: ToolbarDataType.SingleButton,
                        title: 'Hidden action',
                        icon: {data: '<svg />'},
                        exec: vi.fn(),
                        isActive: () => false,
                        isEnable,
                        condition: visibilityRule === 'enabled' ? 'enabled' : condition,
                    },
                ],
            ]);

            await selectText(visibleTo);

            if (visibilityRule === 'condition') {
                expect(condition).toHaveBeenCalledWith(view.state);
            } else {
                expect(isEnable).toHaveBeenCalled();
            }
            expect(getToolbar()).toBeNull();
            expect(await handleEscape()).toBe(false);
        },
    );

    it('should close and reopen the toolbar when selection visibility conditions change', async () => {
        const condition = vi.fn((state: EditorState) => state.selection.to === visibleTo);
        await mountEditor([
            [
                {
                    id: 'conditional-action',
                    type: ToolbarDataType.ReactComponent,
                    width: 80,
                    component: () => <span>Selection action</span>,
                    condition,
                },
            ],
        ]);

        await selectText(visibleTo);
        expect(condition).toHaveBeenCalledWith(view.state);
        expect(getToolbar()?.textContent).toBe('Selection action');

        await selectText(hiddenTo);
        expect(condition).toHaveBeenLastCalledWith(view.state);
        expect(getToolbar()).toBeNull();
        expect(await handleEscape()).toBe(false);

        await selectText(visibleTo);
        expect(condition).toHaveBeenLastCalledWith(view.state);
        expect(getToolbar()?.textContent).toBe('Selection action');

        expect(await handleEscape()).toBe(true);
        expect(getToolbar()).toBeNull();
        expect(await handleEscape()).toBe(false);
    });
});
