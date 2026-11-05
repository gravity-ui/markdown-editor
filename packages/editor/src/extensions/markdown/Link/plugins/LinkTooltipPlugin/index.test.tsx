import {ThemeProvider} from '@gravity-ui/uikit';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../../core';
import {ReactRenderStorage, ReactRendererComponent} from '../../../../../modules/react-renderer';
import {BaseSchemaSpecs} from '../../../../base/specs';
import {ReactRendererExtension} from '../../../../behavior/ReactRenderer';
import {ImageSpecs} from '../../../Image/ImageSpecs';
import {LinkSpecs} from '../../LinkSpecs';
import {addEmptyLink} from '../../actions/linkEnhanceActions';

import {linkTooltipPlugin} from './index';

it('should preserve and save the typed URL after an unrelated editor update', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const storage = new ReactRenderStorage();
    const deps = new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {})
                .use(LinkSpecs)
                .use(ImageSpecs)
                .use(ReactRendererExtension, storage)
                .addPlugin(linkTooltipPlugin),
    }).build();
    const doc = deps.markupParser.parse('before a after\n\nother');
    const editorContainer = document.createElement('div');
    const rendererContainer = document.createElement('div');
    document.body.append(editorContainer, rendererContainer);
    const root = createRoot(rendererContainer);
    const view = new EditorView(editorContainer, {
        state: EditorState.create({
            schema: deps.schema,
            doc,
            selection: TextSelection.create(doc, 8, 9),
            plugins: deps.plugins,
        }),
    });

    try {
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <ReactRendererComponent storage={storage} />
                </ThemeProvider>,
            );
            addEmptyLink(view.state, (tr) => view.dispatch(tr));
        });
        const input = document.querySelector<HTMLInputElement>('.g-md-link-tooltip-view input');
        if (!input) throw new Error('Link tooltip input is missing');

        await act(async () => {
            input.value = 'https://example.com';
            Simulate.change(input);
        });
        expect(input.value).toBe('https://example.com');

        await act(async () => {
            view.dispatch(view.state.tr.insertText('!', view.state.doc.content.size - 1));
        });
        expect(input.value).toBe('https://example.com');

        await act(async () => Simulate.keyDown(input, {key: 'Enter'}));
        expect(deps.serializer.serialize(view.state.doc)).toBe(
            'before [a](https://example.com) after\n\nother!',
        );
        expect(document.querySelector('.g-md-link-tooltip-view')).toBeNull();
    } finally {
        await act(async () => {
            view.destroy();
            root.unmount();
        });
        editorContainer.remove();
        rendererContainer.remove();
        vi.unstubAllGlobals();
    }
});
