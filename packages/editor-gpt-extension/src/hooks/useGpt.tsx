import {useCallback} from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import type {CommonAnswer, GptDialogProps} from '../types';
import {isEnter} from '../utils';

import {useGptFeedback} from './useGptFeedback';
import {type SessionOptions, useGptSession} from './useGptSession';

type Options<A extends CommonAnswer, P> = SessionOptions<A, P> &
    Pick<GptDialogProps<A, P>, 'promptPresets' | 'onLike' | 'onDislike'>;

/** Compatibility facade for the previously exported hook. */
export function useGpt<A extends CommonAnswer = CommonAnswer, P = unknown>(props: Options<A, P>) {
    const session = useGptSession(props);
    const {state} = session;
    const answer = state.status === 'success' ? state.answer : undefined;
    const feedback = useGptFeedback(answer, state.request, props.onLike, props.onDislike);
    const {submit} = feedback;
    const {submitCustom, retry} = session;
    const handleLike = useCallback(() => submit('like'), [submit]);
    const handleDislike = useCallback(() => submit('dislike'), [submit]);
    const handleCustomPromptKeyPress = useCallback<NonNullable<TextInputProps['onKeyPress']>>(
        async (event) => {
            if (isEnter(event)) await submitCustom();
        },
        [submitCustom],
    );
    let mode: 'only-custom' | 'only-presets' | 'custom-and-presets' = 'custom-and-presets';
    if (props.onCustomPromptApply && !props.promptPresets?.length) mode = 'only-custom';
    else if (!props.onCustomPromptApply && props.promptPresets?.length) mode = 'only-presets';
    const handleCustomPromptApply = useCallback(async () => {
        await submitCustom();
    }, [submitCustom]);
    const handleTryAgain = useCallback(async () => {
        await retry();
    }, [retry]);
    return {
        answer,
        customPrompt: session.customPrompt,
        lastRequestData: state.request,
        loading: state.status === 'loading',
        error: state.status === 'error',
        mode,
        feedbackType: feedback.state.status === 'success' ? feedback.state.type : undefined,
        feedbackTypeLoading: feedback.state.status === 'loading' ? feedback.state.type : undefined,
        handleLike,
        handleDislike,
        handleCustomPromptUpdate: session.setCustomPrompt,
        handleCustomPromptKeyPress,
        handleCustomPromptApply,
        handlePresetClick: session.submitPreset,
        handleTryAgain,
        handleFreshStart: session.reset,
        handleApplyResult: session.apply,
        showTryAgainButton: Boolean(
            state.request && props.onTryAgain && state.status !== 'loading',
        ),
        showAnswer: state.status === 'success',
        showError: state.status === 'error',
        showAnswerActions: (props.onLike || props.onDislike) && state.status === 'success',
    };
}
