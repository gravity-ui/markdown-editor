import {useCallback, useEffect, useRef, useState} from 'react';

import type {CommonAnswer, GptDialogProps, GptRequestData} from '../types';

export type SessionState<Answer, Prompt> =
    | {status: 'idle'; request?: GptRequestData<Prompt>}
    | {status: 'loading'; request: GptRequestData<Prompt>}
    | {status: 'success'; request: GptRequestData<Prompt>; answer: Answer}
    | {status: 'error'; request: GptRequestData<Prompt>};

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
    const [state, setState] = useState<SessionState<A, P>>({status: 'idle'});
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
            setState({status: 'loading', request: data});
            let answer: A | undefined;
            let failed = false;
            try {
                answer = await handler(data);
            } catch {
                failed = true;
            }
            if (!mounted.current || current !== revision.current) return;
            pending.current = false;
            if (failed) setState({status: 'error', request: data});
            else if (answer === undefined) setState({status: 'idle', request: data});
            else setState({status: 'success', request: data, answer});
            onUpdate?.(answer);
        },
        [onUpdate],
    );

    const submitCustom = useCallback(async () => {
        if (customPrompt.trim()) await request(onCustomPromptApply, {markup, customPrompt});
    }, [customPrompt, markup, onCustomPromptApply, request]);
    const submitPreset = useCallback(
        (promptData?: P) => request(onPromptPresetClick, {markup, promptData}),
        [markup, onPromptPresetClick, request],
    );
    const retry = useCallback(async () => {
        if (state.request) await request(onTryAgain, state.request);
    }, [onTryAgain, request, state.request]);
    const reset = useCallback(() => {
        invalidate();
        setState({status: 'idle'});
        setCustomPrompt('');
        onUpdate?.(undefined);
    }, [onUpdate, invalidate]);
    const apply = useCallback(() => {
        if (state.status === 'success' && !pending.current) onApplyResult(state.answer.rawText);
    }, [onApplyResult, state]);

    return {state, customPrompt, setCustomPrompt, submitCustom, submitPreset, retry, reset, apply};
}
