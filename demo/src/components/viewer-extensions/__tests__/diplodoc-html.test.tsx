import type {ReactNode} from 'react';

import type {HTMLRuntimeConfig} from '@diplodoc/html-extension';
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {DiplodocHtml} from '../DiplodocHtml';
import type {TransformMeta} from '../types';

const {controller, useController, setupRuntimeConfig} = vi.hoisted(() => {
    const sharedController = {initialize: vi.fn(async () => [])};
    return {
        controller: sharedController,
        useController: vi.fn<() => typeof sharedController | null>(() => sharedController),
        setupRuntimeConfig: vi.fn(),
    };
});
vi.mock('@diplodoc/html-extension/react', () => ({
    useDiplodocEmbeddedContentController: useController,
}));
vi.mock('@diplodoc/html-extension/utils', () => ({setupRuntimeConfig}));

const meta = {script: ['_assets/html-extension.js']};
const html = '<iframe data-yfm-sandbox-mode="srcdoc" srcdoc="<p>HTML block</p>"></iframe>';

describe('DiplodocHtml', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.doMock('@diplodoc/html-extension/runtime', () => ({}));
        controller.initialize.mockResolvedValue([]);
        useController.mockReturnValue(controller);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should load the runtime only for matching metadata', async () => {
        const runtime = 'custom-html.js';
        const loadRuntime = vi.fn(() => ({}));
        vi.doMock('@diplodoc/html-extension/runtime', loadRuntime);
        const view = (currentMeta?: TransformMeta) => (
            <MarkdownViewer html={html}>
                <DiplodocHtml meta={currentMeta} runtime={runtime} />
            </MarkdownViewer>
        );
        await render(view());
        await render(view({script: ['other-runtime.js']}));
        expect(loadRuntime).not.toHaveBeenCalled();
        expect(setupRuntimeConfig).not.toHaveBeenCalled();
        expect(controller.initialize).not.toHaveBeenCalled();

        await render(view({script: [runtime]}));

        expect(loadRuntime).toHaveBeenCalledOnce();
        expect(setupRuntimeConfig).toHaveBeenCalledWith({disabledModes: ['shadow']});
        expect(setupRuntimeConfig.mock.invocationCallOrder[0]).toBeLessThan(
            loadRuntime.mock.invocationCallOrder[0],
        );
        expect(controller.initialize).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('should pass config and runtime policy to the SDK', async () => {
        const runtimeConfig: HTMLRuntimeConfig = {disabledModes: ['shadow', 'isolated']};
        const config = {classNames: ['light'], styles: {'--color': 'white'}};
        await render(
            <MarkdownViewer html={html}>
                <DiplodocHtml meta={meta} config={config} runtimeConfig={runtimeConfig} />
            </MarkdownViewer>,
        );
        expect(controller.initialize).toHaveBeenCalledExactlyOnceWith(config);
        expect(setupRuntimeConfig).toHaveBeenCalledWith(runtimeConfig);
    });

    it('should initialize updated HTML', async () => {
        const view = (content: string) => (
            <MarkdownViewer html={content}>
                <DiplodocHtml meta={meta} />
            </MarkdownViewer>
        );
        await render(view(html));
        expect(controller.initialize).toHaveBeenCalledTimes(1);

        await render(view(html.replace('HTML block', 'Updated block')));

        expect(controller.initialize).toHaveBeenCalledTimes(2);
    });

    it('should initialize when the SDK controller becomes available', async () => {
        const view = () => (
            <MarkdownViewer html={html}>
                <DiplodocHtml meta={meta} />
            </MarkdownViewer>
        );
        useController.mockReturnValue(null);
        await render(view());
        expect(controller.initialize).not.toHaveBeenCalled();

        useController.mockReturnValue(controller);
        await render(view());

        expect(controller.initialize).toHaveBeenCalledOnce();
    });

    it.each(['success', 'failure'] as const)(
        'should ignore a late runtime import after adapter removal (%s)',
        async (outcome) => {
            const pending = Promise.withResolvers<void>();
            const loadRuntime = vi.fn(async () => {
                await pending.promise;
                return {};
            });
            vi.doMock('@diplodoc/html-extension/runtime', loadRuntime);
            const onError = vi.fn();
            await act(async () =>
                root.render(
                    <MarkdownViewer html={html}>
                        <DiplodocHtml meta={meta} onError={onError} />
                    </MarkdownViewer>,
                ),
            );
            await vi.waitFor(() => expect(loadRuntime).toHaveBeenCalledOnce());
            await act(async () => root.render(<MarkdownViewer html={html} />));

            await act(async () => {
                if (outcome === 'success') pending.resolve();
                else pending.reject(new Error('HTML runtime import failed'));
            });
            await act(async () => vi.dynamicImportSettled());

            expect(controller.initialize).not.toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
        },
    );

    it('should report a runtime import failure', async () => {
        vi.doMock('@diplodoc/html-extension/runtime', () => {
            throw new Error('HTML runtime import failed');
        });
        const onError = vi.fn();

        await render(
            <MarkdownViewer html={html}>
                <DiplodocHtml meta={meta} onError={onError} />
            </MarkdownViewer>,
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
        expect(controller.initialize).not.toHaveBeenCalled();
    });

    it('should send initialization errors to onError', async () => {
        const error = new Error('HTML initialization failed');
        const onError = vi.fn();
        controller.initialize.mockRejectedValueOnce(error);

        await render(
            <MarkdownViewer html={html}>
                <DiplodocHtml meta={meta} onError={onError} />
            </MarkdownViewer>,
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    });

    async function render(children: ReactNode) {
        await act(async () => root.render(children));
        await act(async () => vi.dynamicImportSettled());
    }
});
