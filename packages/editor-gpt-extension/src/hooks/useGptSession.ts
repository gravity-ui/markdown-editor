import {useCallback, useEffect, useReducer, useRef, useState} from 'react';

import type {CommonAnswer, GptDialogProps, GptRequestData} from '../types';

export type SessionState<Answer, Prompt> =
    | {status: 'idle'; request?: GptRequestData<Prompt>}
    | {status: 'loading'; request: GptRequestData<Prompt>}
    | {status: 'success'; request: GptRequestData<Prompt>; answer: Answer}
    | {status: 'error'; request: GptRequestData<Prompt>};

type SessionEvent<Answer, Prompt> =
    | {type: 'start'; request: GptRequestData<Prompt>}
    | {type: 'resolve'; request: GptRequestData<Prompt>; answer: Answer | undefined}
    | {type: 'reject'; request: GptRequestData<Prompt>}
    | {type: 'reset'};

function sessionReducer<Answer, Prompt>(
    _state: SessionState<Answer, Prompt>,
    event: SessionEvent<Answer, Prompt>,
): SessionState<Answer, Prompt> {
    switch (event.type) {
        case 'start':
            return {status: 'loading', request: event.request};
        case 'resolve':
            return event.answer === undefined
                ? {status: 'idle', request: event.request}
                : {status: 'success', request: event.request, answer: event.answer};
        case 'reject':
            return {status: 'error', request: event.request};
        case 'reset':
            return {status: 'idle'};
        default:
            return _state;
    }
}

export type SessionOptions<A extends CommonAnswer, P> = Pick<
    GptDialogProps<A, P>,
    | 'markup'
    | 'onCustomPromptApply'
    | 'onPromptPresetClick'
    | 'onTryAgain'
    | 'onApplyResult'
    | 'onUpdate'
>;

export function useGptSession<A extends CommonAnswer, P>(options: SessionOptions<A, P>) {
    const [state, dispatch] = useReducer(sessionReducer<A, P>, {status: 'idle'});
    const [customPrompt, setCustomPrompt] = useState('');
    const revision = useRef(0);
    const mounted = useRef(true);
    const pending = useRef(false);

    const invalidate = useCallback(() => {
        revision.current++;
        pending.current = false;
    }, []);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            invalidate();
        };
    }, [invalidate]);

    const {markup, onCustomPromptApply, onPromptPresetClick, onTryAgain, onApplyResult, onUpdate} =
        options;

    const request = useCallback(
        async (handler: SessionOptions<A, P>['onCustomPromptApply'], data: GptRequestData<P>) => {
            // Synchronous guard also covers double clicks before React renders loading.
            if (!handler || pending.current || !mounted.current) return;
            const current = ++revision.current;
            pending.current = true;
            dispatch({type: 'start', request: data});
            let answer: A | undefined;
            let failed = false;
            try {
                answer = await handler(data);
            } catch {
                failed = true;
            }
            if (!mounted.current || current !== revision.current) return;
            pending.current = false;
            dispatch(
                failed ? {type: 'reject', request: data} : {type: 'resolve', request: data, answer},
            );
            onUpdate?.(answer);
        },
        [onUpdate],
    );

    const submitCustom = useCallback(() => {
        if (!customPrompt.trim()) return undefined;
        return request(onCustomPromptApply, {markup, customPrompt});
    }, [customPrompt, markup, onCustomPromptApply, request]);
    const submitPreset = useCallback(
        (promptData?: P) => request(onPromptPresetClick, {markup, promptData}),
        [markup, onPromptPresetClick, request],
    );
    const retry = useCallback(() => {
        if (state.request) return request(onTryAgain, state.request);
        return undefined;
    }, [onTryAgain, request, state.request]);
    const reset = useCallback(() => {
        invalidate();
        dispatch({type: 'reset'});
        setCustomPrompt('');
        onUpdate?.(undefined);
    }, [onUpdate, invalidate]);
    const apply = useCallback(() => {
        if (state.status === 'success' && !pending.current) onApplyResult(state.answer.rawText);
    }, [onApplyResult, state]);

    return {state, customPrompt, setCustomPrompt, submitCustom, submitPreset, retry, reset, apply};
}
