import {type PropsWithChildren, StrictMode} from 'react';

import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {useGpt} from './useGpt';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {promise, resolve, reject};
}

afterEach(cleanup);

describe('GPT session', () => {
    it('should keep the latest answer when requests finish out of order', async () => {
        const first = deferred<{rawText: string}>();
        const second = deferred<{rawText: string}>();
        const onUpdate = vi.fn();
        const request = vi
            .fn()
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const {result} = renderHook(() =>
            useGpt({
                markup: 'original',
                onApplyResult: vi.fn(),
                onPromptPresetClick: request,
                onUpdate,
            }),
        );

        act(() => {
            result.current.handlePresetClick('first');
        });
        act(() => {
            result.current.handlePresetClick('second');
        });
        await act(async () => {
            second.resolve({rawText: 'second'});
        });
        await act(async () => {
            first.resolve({rawText: 'first'});
        });

        expect(result.current.answer).toEqual({rawText: 'second'});
        expect(result.current.loading).toBe(false);
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith({rawText: 'second'});
    });

    it('should ignore a failed stale request while the current request is loading', async () => {
        const first = deferred<{rawText: string}>();
        const second = deferred<{rawText: string}>();
        const request = vi
            .fn()
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const {result} = renderHook(() =>
            useGpt({markup: 'text', onApplyResult: vi.fn(), onPromptPresetClick: request}),
        );
        act(() => {
            result.current.handlePresetClick();
        });
        act(() => {
            result.current.handlePresetClick();
        });
        await act(async () => {
            first.reject(new Error('stale'));
        });
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBe(false);
        await act(async () => {
            second.resolve({rawText: 'current'});
        });
    });

    it('should reset pending requests and prevent a late update after fresh start', async () => {
        const pending = deferred<{rawText: string}>();
        const onUpdate = vi.fn();
        const {result} = renderHook(() =>
            useGpt({
                markup: 'text',
                onApplyResult: vi.fn(),
                onPromptPresetClick: () => pending.promise,
                onUpdate,
            }),
        );
        act(() => {
            result.current.handlePresetClick();
        });
        act(() => {
            result.current.handleFreshStart();
        });
        await act(async () => {
            pending.resolve({rawText: 'late'});
        });
        expect(result.current.answer).toBeUndefined();
        expect(result.current.loading).toBe(false);
        expect(result.current.lastRequestData).toBeUndefined();
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith(undefined);
    });

    it('should ignore responses after unmount and support StrictMode remounts', async () => {
        const pending = deferred<{rawText: string}>();
        const onUpdate = vi.fn();
        const {result, unmount} = renderHook(
            () =>
                useGpt({
                    markup: 'text',
                    onApplyResult: vi.fn(),
                    onPromptPresetClick: () => pending.promise,
                    onUpdate,
                }),
            {
                wrapper: ({children}: PropsWithChildren) => <StrictMode>{children}</StrictMode>,
            },
        );
        act(() => {
            result.current.handlePresetClick();
        });
        expect(result.current.loading).toBe(true);
        unmount();
        await act(async () => {
            pending.resolve({rawText: 'late'});
        });
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should retry with the original request and apply the returned text', async () => {
        const retry = vi.fn().mockResolvedValue({rawText: 'fixed'});
        const apply = vi.fn();
        const onUpdate = vi.fn();
        const {result} = renderHook(() =>
            useGpt({
                markup: 'text',
                onApplyResult: apply,
                onPromptPresetClick: () => Promise.reject(new Error('failed')),
                onTryAgain: retry,
                onUpdate,
            }),
        );
        await act(async () => {
            await result.current.handlePresetClick('correct');
        });
        expect(result.current.showError).toBe(true);
        expect(onUpdate).toHaveBeenCalledWith(undefined);
        await act(async () => {
            await result.current.handleTryAgain();
        });
        expect(retry).toHaveBeenCalledWith({markup: 'text', promptData: 'correct'});
        act(() => {
            result.current.handleApplyResult();
        });
        expect(apply).toHaveBeenCalledExactlyOnceWith('fixed');
    });

    it('should invalidate old feedback when a new answer arrives', async () => {
        const pendingFeedback = deferred<void>();
        const {result} = renderHook(() =>
            useGpt({
                markup: 'text',
                onApplyResult: vi.fn(),
                onPromptPresetClick: async (data) => ({rawText: String(data.promptData)}),
                onLike: () => pendingFeedback.promise,
            }),
        );
        await act(async () => {
            await result.current.handlePresetClick('first');
        });
        act(() => {
            result.current.handleLike();
        });
        expect(result.current.feedbackTypeLoading).toBe('like');
        await act(async () => {
            await result.current.handlePresetClick('second');
        });
        await act(async () => {
            pendingFeedback.resolve();
        });
        expect(result.current.answer?.rawText).toBe('second');
        expect(result.current.feedbackType).toBeUndefined();
        expect(result.current.feedbackTypeLoading).toBeUndefined();
    });

    it('should not apply an empty or outdated answer while retrying', async () => {
        const pending = deferred<{rawText: string} | undefined>();
        const apply = vi.fn();
        const {result} = renderHook(() =>
            useGpt({
                markup: 'text',
                onApplyResult: apply,
                onPromptPresetClick: async () => ({rawText: 'first'}),
                onTryAgain: () => pending.promise,
            }),
        );
        act(() => {
            result.current.handleApplyResult();
        });
        await act(async () => {
            await result.current.handlePresetClick();
        });
        act(() => {
            result.current.handleTryAgain();
        });
        act(() => {
            result.current.handleApplyResult();
        });
        await act(async () => {
            pending.resolve(undefined);
        });
        act(() => {
            result.current.handleApplyResult();
        });
        expect(apply).not.toHaveBeenCalled();
    });

    it('should isolate sessions for multiple editors', async () => {
        const props = {
            markup: 'text',
            onApplyResult: vi.fn(),
            onCustomPromptApply: async () => ({rawText: 'answer'}),
        };
        const first = renderHook(() => useGpt(props));
        const second = renderHook(() => useGpt(props));
        act(() => {
            first.result.current.handleCustomPromptUpdate('correct');
        });
        await act(async () => {
            await first.result.current.handleCustomPromptApply();
        });
        expect(first.result.current.answer?.rawText).toBe('answer');
        expect(second.result.current.answer).toBeUndefined();
        expect(second.result.current.customPrompt).toBe('');
    });
});
