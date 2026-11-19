import {useState} from 'react';

import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {ThemeProvider} from '@gravity-ui/uikit';
import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../core';
import {ReactRenderStorage, ReactRendererComponent} from '../../../../modules/react-renderer';
import {BaseSchemaSpecs} from '../../../base/specs';
import {ReactRendererExtension} from '../../../behavior/ReactRenderer';
import {SharedState} from '../../../behavior/SharedState';
import {YfmHtmlBlockAttrs, yfmHtmlBlockNodeName} from '../const';
import {YfmHtmlBlock, type YfmHtmlBlockOptions} from '../index';

type OnloadSnapshot = {
    host: HTMLIFrameElement;
    classNames: string[];
    color: string;
    visibility: string;
};

const findIframe = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('.g-md-yfm-html-block__content');
    if (!iframe) throw new Error('Preview iframe is missing');
    return iframe;
};

const getFrameDocument = (iframe: HTMLIFrameElement) => {
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) throw new Error('Preview document is missing');
    return frameDocument;
};

// a browser replaces the initial document with the srcdoc one on load, jsdom does not
const replaceDocumentBody = (iframe: HTMLIFrameElement) => {
    const frameDocument = getFrameDocument(iframe);
    frameDocument.documentElement.replaceChild(
        frameDocument.createElement('body'),
        frameDocument.body,
    );
};

// jsdom does not navigate to srcdoc: it fires one load right after the iframe is attached
const waitForLoad = (iframe: HTMLIFrameElement) =>
    act(
        () =>
            new Promise<void>((resolve) => {
                iframe.addEventListener('load', () => resolve(), {once: true});
            }),
    );

describe('YfmHtmlBlock preview', () => {
    let view: EditorView;
    let root: Root;
    let editorContainer: HTMLDivElement;
    let rendererContainer: HTMLDivElement;
    let setTheme: (theme: string) => void;
    let snapshots: OnloadSnapshot[];
    let disposeOnload: () => void;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                disconnect() {}
            },
        );
        snapshots = [];
        disposeOnload = vi.fn<() => void>();
    });

    const onload = (host: HTMLIFrameElement) => {
        const {body} = getFrameDocument(host);
        snapshots.push({
            host,
            classNames: Array.from(body.classList),
            color: body.style.getPropertyValue('--test-color'),
            visibility: host.style.visibility,
        });
        body.style.setProperty('--test-color', 'adapted');
        return disposeOnload;
    };

    const useConfig = (): IHTMLIFrameElementConfig => {
        const [theme, setThemeState] = useState('dark');
        setTheme = setThemeState;
        return {classNames: [theme], styles: {'--test-color': theme}, onload};
    };

    function render(options: YfmHtmlBlockOptions) {
        const storage = new ReactRenderStorage();
        const {schema, plugins, nodeViews} = new ExtensionsManager({
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(SharedState)
                    .use(ReactRendererExtension, storage)
                    .use(YfmHtmlBlock, options),
        }).build();
        const {doc, yfmHtmlBlock} = builders<'doc' | 'yfmHtmlBlock'>(schema, {
            yfmHtmlBlock: {nodeType: yfmHtmlBlockNodeName},
        });

        editorContainer = document.createElement('div');
        rendererContainer = document.createElement('div');
        document.body.append(editorContainer, rendererContainer);
        root = createRoot(rendererContainer);
        view = new EditorView(editorContainer, {
            nodeViews,
            state: EditorState.create({
                schema,
                plugins,
                doc: doc(
                    yfmHtmlBlock({
                        [YfmHtmlBlockAttrs.srcdoc]: '<p>Quoted message</p>',
                        [YfmHtmlBlockAttrs.EntityId]: 'yfm_html_block-test',
                    }),
                ),
            }),
        });

        act(() => {
            root.render(
                <ThemeProvider>
                    <ReactRendererComponent storage={storage} />
                </ThemeProvider>,
            );
        });
    }

    async function renderLoadedWithConfig() {
        render({useConfig});
        await waitForLoad(findIframe());
    }

    afterEach(() => {
        act(() => {
            root.unmount();
            view.destroy();
        });
        editorContainer?.remove();
        rendererContainer?.remove();
        vi.unstubAllGlobals();
    });

    it('should call onload from useConfig on the styled hidden iframe', async () => {
        await renderLoadedWithConfig();
        const iframe = findIframe();

        expect(snapshots).toEqual([
            {host: iframe, classNames: ['dark'], color: 'dark', visibility: 'hidden'},
        ]);
        expect(iframe.style.visibility).toBe('visible');
    });

    it('should keep the changes onload makes to the loaded document', async () => {
        render({useConfig});
        const iframe = findIframe();
        replaceDocumentBody(iframe);

        await waitForLoad(iframe);

        expect(getFrameDocument(iframe).body.style.getPropertyValue('--test-color')).toBe(
            'adapted',
        );
    });

    it('should style the document that replaces the initial one on load', async () => {
        await renderLoadedWithConfig();
        const iframe = findIframe();
        replaceDocumentBody(iframe);

        await act(async () => {
            iframe.dispatchEvent(new Event('load'));
        });

        expect(disposeOnload).toHaveBeenCalledTimes(1);
        expect(snapshots).toHaveLength(2);
        const snapshot = snapshots.at(-1);
        expect(snapshot?.host).toBe(iframe);
        expect(snapshot?.classNames).toEqual(['dark']);
        expect(snapshot?.color).toBe('dark');
    });

    it('should recreate the hidden preview and dispose onload when html changes', async () => {
        await renderLoadedWithConfig();
        const iframe = findIframe();

        act(() => {
            view.dispatch(
                view.state.tr.setNodeAttribute(0, YfmHtmlBlockAttrs.srcdoc, '<p>Edited</p>'),
            );
        });

        const nextIframe = findIframe();
        expect(nextIframe).not.toBe(iframe);
        expect(nextIframe.style.visibility).toBe('hidden');
        expect(disposeOnload).toHaveBeenCalledTimes(1);

        await waitForLoad(nextIframe);

        expect(snapshots.map(({host}) => host)).toEqual([iframe, nextIframe]);
        expect(nextIframe.style.visibility).toBe('visible');
    });

    it('should recreate the preview when the config theme changes', async () => {
        await renderLoadedWithConfig();
        const iframe = findIframe();

        act(() => setTheme('light'));

        const nextIframe = findIframe();
        expect(nextIframe).not.toBe(iframe);
        expect(disposeOnload).toHaveBeenCalledTimes(1);

        await waitForLoad(nextIframe);

        expect(snapshots.at(-1)).toEqual({
            host: nextIframe,
            classNames: ['light'],
            color: 'light',
            visibility: 'hidden',
        });
    });

    it('should dispose onload when the block is removed', async () => {
        await renderLoadedWithConfig();

        act(() => {
            view.dispatch(view.state.tr.delete(0, view.state.doc.content.size));
        });

        expect(disposeOnload).toHaveBeenCalledTimes(1);
    });

    it('should show the preview before load and edit it on double click without useConfig', async () => {
        render({});
        const iframe = findIframe();
        expect(iframe.style.visibility).toBe('visible');

        await waitForLoad(iframe);
        act(() => {
            getFrameDocument(iframe).dispatchEvent(new MouseEvent('dblclick'));
        });

        expect(document.querySelector('.g-md-yfm-html-block_editing')).not.toBeNull();
    });
});
