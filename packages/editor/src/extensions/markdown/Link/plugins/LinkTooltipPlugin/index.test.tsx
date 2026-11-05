import {ThemeProvider} from '@gravity-ui/uikit';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {type Root, createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../../core';
import {ReactRenderStorage, ReactRendererComponent} from '../../../../../modules/react-renderer';
import {BaseNode, BaseSchemaSpecs} from '../../../../base/specs';
import {ReactRendererExtension} from '../../../../behavior/ReactRenderer';
import {ImageSpecs} from '../../../Image/ImageSpecs';
import {LinkSpecs} from '../../LinkSpecs';
import {addEmptyLink} from '../../actions/linkEnhanceActions';

import {linkTooltipPlugin} from './index';

describe('link tooltip URL editing', () => {
    let deps: ReturnType<ExtensionsManager['build']>;
    let view: EditorView;
    let root: Root;
    let editorContainer: HTMLDivElement;
    let rendererContainer: HTMLDivElement;
    let updatePosition: number;

    beforeEach(async () => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        const storage = new ReactRenderStorage();
        deps = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(LinkSpecs)
                    .use(ImageSpecs)
                    .use(ReactRendererExtension, storage)
                    .addPlugin(linkTooltipPlugin),
        }).build();
        const {doc, p} = builders(deps.schema, {p: {nodeType: BaseNode.Paragraph}});
        const documentNode = doc(p('before <from>a<to> after'), p('other<update>'));
        updatePosition = documentNode.tag.update;
        editorContainer = document.createElement('div');
        rendererContainer = document.createElement('div');
        document.body.append(editorContainer, rendererContainer);
        root = createRoot(rendererContainer);
        view = new EditorView(editorContainer, {
            state: EditorState.create({
                schema: deps.schema,
                doc: documentNode,
                selection: TextSelection.create(
                    documentNode,
                    documentNode.tag.from,
                    documentNode.tag.to,
                ),
                plugins: deps.plugins,
            }),
        });

        await act(async () => {
            root.render(
                <ThemeProvider>
                    <ReactRendererComponent storage={storage} />
                </ThemeProvider>,
            );
            addEmptyLink(view.state, (tr) => view.dispatch(tr));
        });
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

    it('should preserve and save the typed URL after an unrelated editor update', async () => {
        const input = document.querySelector<HTMLInputElement>('.g-md-link-tooltip-view input');
        if (!input) throw new Error('Link tooltip input is missing');

        await act(async () => {
            input.value = 'https://example.com';
            Simulate.change(input);
        });
        expect(input.value).toBe('https://example.com');

        await act(async () => {
            view.dispatch(view.state.tr.insertText('!', updatePosition));
        });
        expect(input.value).toBe('https://example.com');

        await act(async () => Simulate.keyDown(input, {key: 'Enter'}));
        expect(deps.serializer.serialize(view.state.doc)).toBe(
            'before [a](https://example.com) after\n\nother!',
        );
        expect(document.querySelector('.g-md-link-tooltip-view')).toBeNull();
    });
});
