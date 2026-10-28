import {useCallback, useState} from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import type {CommonAnswer, GptRequestData} from '../ErrorScreen/types';
import type {GptDialogProps, PresetListProps} from '../types';
import {isEnter} from '../utils';

import {useGptFeedback} from './useGptFeedback';
import {useGptRequest} from './useGptRequest';

type UseGptProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Pick<
    GptDialogProps<AnswerData, PromptData>,
    | 'markup'
    | 'promptPresets'
    | 'onCustomPromptApply'
    | 'onPromptPresetClick'
    | 'onTryAgain'
    | 'onLike'
    | 'onDislike'
    | 'onApplyResult'
    | 'onUpdate'
>;

export const useGpt = <
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>({
    markup,
    promptPresets,
    onCustomPromptApply,
    onPromptPresetClick,
    onTryAgain,
    onLike,
    onDislike,
    onApplyResult,
    onUpdate,
}: UseGptProps<AnswerData, PromptData>) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const {state, request: makeRequest, reset} = useGptRequest<AnswerData, PromptData>(onUpdate);
    const {answer, lastRequestData} = state;
    const loading = state.status === 'loading';
    const error = state.status === 'error';
    const {feedbackType, feedbackTypeLoading, handleLike, handleDislike} = useGptFeedback(
        answer,
        lastRequestData,
        onLike,
        onDislike,
    );

    const handleCustomPromptApply = useCallback(async () => {
        if (!customPrompt) {
            return;
        }

        const gptRequestData: GptRequestData<PromptData> = {
            markup,
            customPrompt,
        };

        await makeRequest(onCustomPromptApply, gptRequestData);
    }, [customPrompt, makeRequest, markup, onCustomPromptApply]);

    const handleCustomPromptKeyPress = useCallback<NonNullable<TextInputProps['onKeyPress']>>(
        async (event) => {
            if (!isEnter(event)) {
                return;
            }

            await handleCustomPromptApply();
        },
        [handleCustomPromptApply],
    );

    const handlePresetClick = useCallback<PresetListProps<AnswerData, PromptData>['onPresetClick']>(
        async (data) => {
            const gptRequestData: GptRequestData<PromptData> = {
                markup,
                promptData: data,
            };

            await makeRequest(onPromptPresetClick, gptRequestData);
        },
        [makeRequest, markup, onPromptPresetClick],
    );

    const handleTryAgain = useCallback(async () => {
        if (!lastRequestData) {
            return;
        }

        await makeRequest(onTryAgain, lastRequestData);
    }, [lastRequestData, makeRequest, onTryAgain]);

    const handleApplyResult = useCallback(() => {
        if (answer && !loading && !error) onApplyResult(answer.rawText);
    }, [answer, loading, error, onApplyResult]);

    const handleFreshStart = useCallback(() => {
        setCustomPrompt('');
        reset();
    }, [reset]);

    const showTryAgainButton = Boolean(lastRequestData && onTryAgain && !loading);
    const showAnswer = Boolean(answer && !loading && !error);
    const showError = error && !loading;
    const showAnswerActions = (onLike || onDislike) && showAnswer;

    let mode: 'custom-and-presets' | 'only-custom' | 'only-presets' = 'custom-and-presets';

    if (onCustomPromptApply && !promptPresets?.length) {
        mode = 'only-custom';
    } else if (!onCustomPromptApply && promptPresets?.length) {
        mode = 'only-presets';
    }

    return {
        answer,
        customPrompt,
        lastRequestData,
        loading,
        error,
        mode,
        feedbackType,
        feedbackTypeLoading,
        handleLike,
        handleDislike,
        handleCustomPromptUpdate: setCustomPrompt,
        handleCustomPromptKeyPress,
        handleCustomPromptApply,
        handlePresetClick,
        handleTryAgain,
        handleFreshStart,
        handleApplyResult,
        showTryAgainButton,
        showAnswer,
        showError,
        showAnswerActions,
    };
};

export type GptSession<A extends CommonAnswer, P> = ReturnType<typeof useGpt<A, P>>;
