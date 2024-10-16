import {useCallback, useState} from 'react';

import type {TextInputProps} from '@gravity-ui/uikit';

import type {CommonAnswer, GptRequestData} from '../ErrorScreen/types';
import type {GptDialogProps} from '../GptDialog/GptDialog';
import type {PresetListProps} from '../PresetList/PresetList';
import {isEnter} from '../utils';

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
    const [answer, setAnswer] = useState<AnswerData>();
    const [lastRequestData, setLastRequestData] = useState<GptRequestData<PromptData>>();
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'like' | 'dislike' | undefined>(undefined);
    const [feedbackTypeLoading, setFeedbackTypeLoading] = useState<'like' | 'dislike' | undefined>(
        undefined,
    );

    const makeRequest: (
        requestFunction: UseGptProps<AnswerData, PromptData>['onPromptPresetClick'],
        data: GptRequestData<PromptData>,
    ) => Promise<void> = useCallback(
        async (requestFunction, data) => {
            if (!requestFunction) {
                return;
            }

            let result;

            try {
                setLoading(true);
                setError(false);
                setLastRequestData(data);

                result = await requestFunction(data);

                if (result) {
                    setAnswer(result);
                    setFeedbackType(undefined);
                }
            } catch (error) {
                console.error(error);

                setError(true);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    // hack for popup rerender
                    // When a lot of text is entered into the GPT popup,
                    // it expands and goes beyond the boundaries. However,
                    // the popup does not handle height changes.
                    window.dispatchEvent(new CustomEvent('scroll'));
                });
                onUpdate?.(result);
            }
        },
        [onUpdate],
    );

    const handleLike = useCallback(async () => {
        if (!onLike || !lastRequestData) {
            return;
        }

        try {
            setFeedbackType(undefined);
            setFeedbackTypeLoading('like');

            await onLike(lastRequestData);

            setFeedbackType('like');
        } catch (error) {
            console.error(error);
        } finally {
            setFeedbackTypeLoading(undefined);
        }
    }, [lastRequestData, onLike]);

    const handleDislike = useCallback(async () => {
        if (!onDislike || !lastRequestData) {
            return;
        }

        try {
            setFeedbackType(undefined);
            setFeedbackTypeLoading('dislike');

            await onDislike(lastRequestData);

            setFeedbackType('dislike');
        } catch (error) {
            console.error(error);
        } finally {
            setFeedbackTypeLoading(undefined);
        }
    }, [lastRequestData, onDislike]);

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
        onApplyResult(answer?.rawText ?? '');
    }, [answer?.rawText, onApplyResult]);

    const handleFreshStart = useCallback(() => {
        setError(false);
        setLastRequestData(undefined);
        setAnswer(undefined);
        setCustomPrompt('');
        setFeedbackType(undefined);

        onUpdate?.(undefined);
    }, [onUpdate]);

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
