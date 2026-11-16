// @vitest-environment jsdom
import {StrictMode} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {CommonAnswer} from '../types';

import {useGptFeedback} from './useGptFeedback';
import {type SessionOptions, useGptSession} from './useGptSession';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {promise, resolve, reject};
}

describe('GPT session', () => {
    let container: HTMLDivElement;
    let root: Root;
    let session: ReturnType<typeof useGptSession<CommonAnswer, string>>;
    let feedback: ReturnType<typeof useGptFeedback<CommonAnswer, string>>;
    let options: SessionOptions<CommonAnswer, string>;
    let onLike = vi.fn(async (_request: unknown) => {});

    function Harness() {
        session = useGptSession(options);
        feedback = useGptFeedback(
            session.state.status === 'success' ? session.state.answer : undefined,
            session.state.request,
            onLike,
            undefined,
        );
        return null;
    }
    function render() {
        act(() =>
            root.render(
                <StrictMode>
                    <Harness />
                </StrictMode>,
            ),
        );
    }
    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        onLike = vi.fn(async () => {});
        options = {markup: 'source', onApplyResult: vi.fn(), onUpdate: vi.fn()};
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it('should send the original payload and apply a successful answer', async () => {
        options.onCustomPromptApply = vi.fn(async () => ({rawText: 'answer'}));
        render();
        act(() => session.setCustomPrompt('Fix spelling'));
        await act(async () => {
            await session.submitCustom();
        });
        expect(options.onCustomPromptApply).toHaveBeenCalledExactlyOnceWith({
            markup: 'source',
            customPrompt: 'Fix spelling',
        });
        expect(session.state.status).toBe('success');
        expect(options.onUpdate).toHaveBeenCalledExactlyOnceWith({rawText: 'answer'});
        act(() => session.apply());
        expect(options.onApplyResult).toHaveBeenCalledExactlyOnceWith('answer');
    });

    it('should ignore repeated submissions while a request is pending', async () => {
        const result = deferred<CommonAnswer>();
        options.onPromptPresetClick = vi.fn(() => result.promise);
        render();
        act(() => {
            session.submitPreset('first');
            session.submitPreset('second');
            session.apply();
        });
        expect(session.state.status).toBe('loading');
        expect(options.onPromptPresetClick).toHaveBeenCalledTimes(1);
        expect(options.onApplyResult).not.toHaveBeenCalled();
        await act(async () => {
            result.resolve({rawText: 'answer'});
        });
        expect(session.state.status).toBe('success');
    });

    it('should ignore a stale answer after reset and a newer request', async () => {
        const old = deferred<CommonAnswer>();
        const current = deferred<CommonAnswer>();
        options.onPromptPresetClick = vi
            .fn()
            .mockReturnValueOnce(old.promise)
            .mockReturnValueOnce(current.promise);
        render();
        act(() => {
            session.submitPreset('old');
        });
        act(() => session.reset());
        act(() => {
            session.submitPreset('new');
        });
        await act(async () => {
            current.resolve({rawText: 'new'});
        });
        await act(async () => {
            old.resolve({rawText: 'old'});
        });
        expect(session.state).toMatchObject({
            status: 'success',
            answer: {rawText: 'new'},
            request: {promptData: 'new'},
        });
        expect(options.onUpdate).toHaveBeenCalledTimes(2);
        expect(options.onUpdate).toHaveBeenLastCalledWith({rawText: 'new'});
    });

    it('should ignore both completion and notification after unmount', async () => {
        const result = deferred<CommonAnswer>();
        options.onPromptPresetClick = () => result.promise;
        render();
        act(() => {
            session.submitPreset();
        });
        act(() => root.render(null));
        await act(async () => {
            result.resolve({rawText: 'late'});
        });
        expect(options.onUpdate).not.toHaveBeenCalled();
    });

    it('should retry an error using the original request even when markup changes', async () => {
        options.onPromptPresetClick = async () => {
            throw new Error('request failed');
        };
        options.onTryAgain = vi.fn(async () => ({rawText: 'retried'}));
        render();
        await act(async () => {
            await session.submitPreset('correct');
        });
        expect(session.state.status).toBe('error');
        expect(options.onUpdate).toHaveBeenCalledWith(undefined);
        options = {...options, markup: 'different'};
        render();
        await act(async () => {
            await session.retry();
        });
        expect(options.onTryAgain).toHaveBeenCalledExactlyOnceWith({
            markup: 'source',
            promptData: 'correct',
        });
        expect(session.state.status).toBe('success');
    });

    it('should return to idle for an undefined result and keep retry data', async () => {
        options.onPromptPresetClick = async () => undefined;
        render();
        await act(async () => {
            await session.submitPreset('correct');
        });
        expect(session.state).toEqual({
            status: 'idle',
            request: {markup: 'source', promptData: 'correct'},
        });
        expect(options.onUpdate).toHaveBeenCalledExactlyOnceWith(undefined);
        act(() => session.apply());
        expect(options.onApplyResult).not.toHaveBeenCalled();
    });

    it('should ignore an empty prompt and allow a deliberately empty answer', async () => {
        options.onCustomPromptApply = vi.fn(async () => ({rawText: ''}));
        render();
        act(() => session.setCustomPrompt('  '));
        await act(async () => {
            await session.submitCustom();
        });
        expect(options.onCustomPromptApply).not.toHaveBeenCalled();
        act(() => session.setCustomPrompt('remove'));
        await act(async () => {
            await session.submitCustom();
        });
        act(() => session.apply());
        expect(options.onApplyResult).toHaveBeenCalledExactlyOnceWith('');
    });

    it('should ignore feedback for an answer discarded by reset', async () => {
        const result = deferred<void>();
        onLike = vi.fn(() => result.promise);
        options.onPromptPresetClick = async () => ({rawText: 'answer'});
        render();
        await act(async () => {
            await session.submitPreset('correct');
        });
        act(() => {
            feedback.submit('like');
            feedback.submit('like');
        });
        expect(onLike).toHaveBeenCalledExactlyOnceWith({markup: 'source', promptData: 'correct'});
        expect(feedback.state.status).toBe('loading');
        act(() => session.reset());
        await act(async () => {
            result.resolve();
        });
        expect(feedback.state).toEqual({status: 'idle'});
        expect(session.state.status).toBe('idle');
    });

    it('should allow another feedback attempt after a rejected callback', async () => {
        onLike = vi
            .fn()
            .mockRejectedValueOnce(new Error('failed'))
            .mockResolvedValueOnce(undefined);
        options.onPromptPresetClick = async () => ({rawText: 'answer'});
        render();
        await act(async () => {
            await session.submitPreset();
        });
        await act(async () => {
            await feedback.submit('like');
        });
        expect(feedback.state).toEqual({status: 'idle'});
        await act(async () => {
            await feedback.submit('like');
        });
        expect(feedback.state).toEqual({status: 'success', type: 'like'});
    });
});
