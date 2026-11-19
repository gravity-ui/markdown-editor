import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {YfmHtmlBlock, type YfmHtmlBlockProps} from '../index';

const {controller, useController, setupRuntimeConfig} = vi.hoisted(() => {
    const sharedController = {initialize: vi.fn(async () => []), disposeChildren: vi.fn()};
    return {
        controller: sharedController,
        useController: vi.fn<() => typeof sharedController | null>(() => sharedController),
        setupRuntimeConfig: vi.fn(),
    };
});
vi.mock('@diplodoc/html-extension/react', () => ({
    default: {useDiplodocEmbeddedContentController: useController},
}));
vi.mock('@diplodoc/html-extension/utils', () => ({default: {setupRuntimeConfig}}));

const meta = {script: ['_assets/html-extension.js']};
const html = '<iframe data-yfm-sandbox-mode="srcdoc" srcdoc="<p>HTML block</p>"></iframe>';

describe('YfmHtmlBlock', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.doMock('@diplodoc/html-extension/runtime', () => ({}));
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
        await renderBlock({meta: undefined, runtime});
        await renderBlock({meta: {script: ['other-runtime.js']}, runtime});
        expect(loadRuntime).not.toHaveBeenCalled();
        expect(setupRuntimeConfig).not.toHaveBeenCalled();
        expect(controller.initialize).not.toHaveBeenCalled();

        await renderBlock({meta: {script: [runtime]}, runtime});

        expect(loadRuntime).toHaveBeenCalledOnce();
        expect(setupRuntimeConfig).toHaveBeenCalledWith({disabledModes: ['shadow']});
        expect(setupRuntimeConfig.mock.invocationCallOrder[0]).toBeLessThan(
            loadRuntime.mock.invocationCallOrder[0],
        );
        expect(controller.initialize).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('should pass iframe settings and runtime policy to Diplodoc', async () => {
        const runtimeConfig: NonNullable<YfmHtmlBlockProps['runtimeConfig']> = {
            disabledModes: ['isolated'],
        };
        const config = {classNames: ['light'], styles: {'--color': 'white'}};
        await renderBlock({config, runtimeConfig});
        expect(controller.initialize).toHaveBeenCalledExactlyOnceWith(config);
        expect(setupRuntimeConfig).toHaveBeenCalledWith({disabledModes: ['isolated']});
    });

    it('should keep shared controller children when the viewer unmounts', async () => {
        await renderBlock();
        expect(controller.initialize).toHaveBeenCalledOnce();

        await act(async () => root.unmount());

        expect(controller.disposeChildren).not.toHaveBeenCalled();
    });

    it('should initialize updated HTML', async () => {
        await renderBlock();
        expect(controller.initialize).toHaveBeenCalledTimes(1);

        await renderBlock({}, html.replace('HTML block', 'Updated block'));

        expect(controller.initialize).toHaveBeenCalledTimes(2);
    });

    it('should initialize when the controller becomes available', async () => {
        useController.mockReturnValue(null);
        await renderBlock();
        expect(controller.initialize).not.toHaveBeenCalled();

        useController.mockReturnValue(controller);
        await renderBlock();

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
                        <YfmHtmlBlock meta={meta} onError={onError} />
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

        await renderBlock({onError});

        expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
        expect(controller.initialize).not.toHaveBeenCalled();
    });

    it('should send initialization errors to onError', async () => {
        const error = new Error('HTML initialization failed');
        const onError = vi.fn();
        controller.initialize.mockRejectedValueOnce(error);

        await renderBlock({onError});

        expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    });

    async function renderBlock(props: YfmHtmlBlockProps = {}, content = html) {
        await act(async () =>
            root.render(
                <MarkdownViewer html={content}>
                    <YfmHtmlBlock meta={meta} {...props} />
                </MarkdownViewer>,
            ),
        );
        await act(async () => vi.dynamicImportSettled());
    }
});
