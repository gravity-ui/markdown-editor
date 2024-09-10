import type {FC} from 'react';
import React, {useCallback, useRef, useState} from 'react';

import {ArrowRight, ArrowRotateLeft, ThumbsDown, ThumbsUp} from '@gravity-ui/icons';
import {ActionTooltip, Alert, AlertProps, Button, Icon, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {i18n} from '../../../../i18n/gpt/dialog';
import gptIcon from '../../../../icons/GPT';
import {ErrorScreen} from '../ErrorScreen/ErrorScreen';
import type {CommonAnswer, GptRequestData, PromptPreset} from '../ErrorScreen/types';
import {IconRefuge} from '../IconRefuge/IconRefuge';
import {PresetList} from '../PresetList/PresetList';
import {gptHotKeys} from '../constants';
import {useAutoFocus} from '../hooks/useAutoFocus';
import {useGpt} from '../hooks/useGpt';
import {useGptHotKeys} from '../hooks/useGptHotKeys';
import {getAlertGptInfo, getDisableReplaceButtonText, getInputPlaceHolder} from '../utils';

import {LoadingScreen} from './LoadingScreen/LoadingScreen';

import './GptDialog.scss';

export type GptDialogProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = {
    markup: string;
    answerRender: (data: AnswerData) => JSX.Element;
    onApplyResult: (markup: string) => void;
    promptPresets?: PromptPreset<PromptData>[];
    disablePromptPresets?: boolean;
    customPromptPlaceholder?: string;
    disabledPromptPlaceholder?: string;
    onCustomPromptApply?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onPromptPresetClick?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onTryAgain?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onLike?: (data: GptRequestData<PromptData>) => Promise<void>;
    onDislike?: (data: GptRequestData<PromptData>) => Promise<void>;
    onClose?: () => void;
    onUpdate?: (value: AnswerData | undefined) => void;
    gptAlertProps?: {
        showedGptAlert: boolean;
        onCloseGptAlert?: () => void;
        message?: string;
        theme?: AlertProps['theme'];
        className?: string;
    };
};

export const cnGptDialog = cn('gpt-dialog');

export const GptDialog: FC<GptDialogProps> = ({
    markup,
    answerRender,
    promptPresets,
    disablePromptPresets,
    customPromptPlaceholder,
    disabledPromptPlaceholder,
    onCustomPromptApply,
    onPromptPresetClick,
    onTryAgain,
    onApplyResult,
    onClose,
    onLike,
    onDislike,
    onUpdate,
    gptAlertProps,
}) => {
    const {
        answer,
        customPrompt,
        loading,
        mode,
        feedbackType,
        feedbackTypeLoading,
        handleLike,
        handleDislike,
        handleCustomPromptUpdate,
        handleCustomPromptKeyPress,
        handleCustomPromptApply,
        handlePresetClick,
        handleTryAgain,
        handleFreshStart,
        handleApplyResult,
        showAnswer,
        showError,
        showAnswerActions,
        showTryAgainButton,
    } = useGpt({
        markup,
        promptPresets,
        onLike,
        onDislike,
        onCustomPromptApply,
        onPromptPresetClick,
        onTryAgain,
        onApplyResult,
        onUpdate,
    });

    const gptAlert = gptAlertProps;

    const customPromptContainerRef = useRef<HTMLDivElement>(null);

    const [showedGptAlert, setShowedGptAlert] = useState(gptAlert?.showedGptAlert);

    const {alertMessage, alertTheme, alertClassName} = getAlertGptInfo(gptAlert);

    const onCloseAlert = useCallback(() => {
        if (gptAlert) {
            gptAlert.showedGptAlert = false;
        }
        gptAlert?.onCloseGptAlert?.();

        setShowedGptAlert(false);
    }, [gptAlert]);

    useAutoFocus({
        containerRef: customPromptContainerRef,
        elementSelector: 'input',
    });

    useGptHotKeys(gptHotKeys.tryAgainGpt, handleTryAgain);
    useGptHotKeys(gptHotKeys.freshStartGpt, handleFreshStart);
    useGptHotKeys(gptHotKeys.applyResultGpt, handleApplyResult);

    const replaceButtonText = getDisableReplaceButtonText(disablePromptPresets);

    const inputPlaceholderText = getInputPlaceHolder(
        disablePromptPresets,
        disabledPromptPlaceholder,
        customPromptPlaceholder,
    );

    const tryAgainButton = (
        <ActionTooltip hotkey={gptHotKeys.tryAgainGpt} title={i18n('try-again')}>
            <Button
                className={cnGptDialog('try-again-button')}
                view="normal"
                size="m"
                onClick={handleTryAgain}
            >
                <Icon data={ArrowRotateLeft} size={16} />
                {i18n('try-again')}
            </Button>
        </ActionTooltip>
    );

    let content = null;

    if (loading) {
        content = <LoadingScreen />;
    } else if (showError) {
        content = <ErrorScreen onRetry={handleTryAgain} onStartAgain={handleFreshStart} />;
    } else {
        content = (
            <>
                <div className={cnGptDialog('header')}>
                    <div className={cnGptDialog('header-top')}>
                        <IconRefuge
                            containerClassName={cnGptDialog('gpt-icon')}
                            data={gptIcon}
                            refugeSize={28}
                            size={16}
                        />
                        {(mode === 'only-custom' || mode === 'custom-and-presets') &&
                            (showAnswer ? (
                                <span className={cnGptDialog('answer-title')}>
                                    {i18n('answer-title')}
                                </span>
                            ) : (
                                <div
                                    className={cnGptDialog('custom-prompt')}
                                    ref={customPromptContainerRef}
                                >
                                    <TextInput
                                        view="clear"
                                        size="m"
                                        className={cnGptDialog('custom-prompt-input')}
                                        placeholder={inputPlaceholderText}
                                        onKeyPress={handleCustomPromptKeyPress}
                                        onUpdate={handleCustomPromptUpdate}
                                    />
                                    <Button
                                        className={cnGptDialog('custom-prompt-ask-button')}
                                        view="normal"
                                        size="s"
                                        disabled={!customPrompt}
                                        onClick={handleCustomPromptApply}
                                    >
                                        <Icon data={ArrowRight} size={16} />
                                    </Button>
                                </div>
                            ))}
                        {mode === 'only-presets' && (
                            <div className={cnGptDialog('alone-presets')}>
                                <span className={cnGptDialog('alone-presets-text')}>
                                    {i18n('only-presets-title')}
                                </span>
                            </div>
                        )}
                    </div>
                    {(mode === 'custom-and-presets' || mode === 'only-presets') &&
                        ((showTryAgainButton && (
                            <div className={cnGptDialog('header-bottom')}>
                                {tryAgainButton}
                                <ActionTooltip
                                    title={i18n('fresh-start-button')}
                                    hotkey={gptHotKeys.freshStartGpt}
                                >
                                    <Button
                                        className={cnGptDialog('back-to-start')}
                                        view="normal"
                                        size="m"
                                        onClick={handleFreshStart}
                                    >
                                        {i18n('fresh-start-button')}
                                    </Button>
                                </ActionTooltip>
                            </div>
                        )) ||
                            (!disablePromptPresets && (
                                <div className={cnGptDialog('header-bottom')}>
                                    <PresetList
                                        disablePromptPresets={disablePromptPresets}
                                        promptPresets={promptPresets}
                                        onPresetClick={handlePresetClick}
                                    />
                                </div>
                            )) ||
                            (disablePromptPresets && showedGptAlert && (
                                <Alert
                                    theme={alertTheme}
                                    message={alertMessage}
                                    align="center"
                                    className={cnGptDialog('description-alert', alertClassName)}
                                    onClose={onCloseAlert}
                                />
                            )))}
                </div>
                {showAnswer && (
                    <>
                        <div className={cnGptDialog('body')}>
                            <div className={cnGptDialog('answer')}>{answerRender(answer!)}</div>
                        </div>
                        <div className={cnGptDialog('footer')}>
                            {showAnswerActions && (
                                <div className={cnGptDialog('answer-actions')}>
                                    <Button
                                        className={cnGptDialog('like-button')}
                                        view="normal"
                                        size="m"
                                        onClick={handleLike}
                                        selected={feedbackType === 'like'}
                                        loading={feedbackTypeLoading === 'like'}
                                    >
                                        <Icon data={ThumbsUp} size={16} />
                                    </Button>
                                    <Button
                                        className={cnGptDialog('dislike-button')}
                                        view="normal"
                                        size="m"
                                        onClick={handleDislike}
                                        selected={feedbackType === 'dislike'}
                                        loading={feedbackTypeLoading === 'dislike'}
                                    >
                                        <Icon data={ThumbsDown} size={16} />
                                    </Button>
                                    {feedbackType && (
                                        <span className={cnGptDialog('feedback-message')}>
                                            {i18n('feedback-message')}
                                        </span>
                                    )}
                                </div>
                            )}
                            <ActionTooltip
                                title={i18n('close-button')}
                                hotkey={gptHotKeys.closeGpt}
                            >
                                <Button
                                    className={cnGptDialog('close-button')}
                                    view="flat"
                                    size="m"
                                    onClick={onClose}
                                >
                                    {i18n('close-button')}
                                </Button>
                            </ActionTooltip>
                            <ActionTooltip
                                title={replaceButtonText}
                                hotkey={gptHotKeys.applyResultGpt}
                            >
                                <Button
                                    className={cnGptDialog('apply-button')}
                                    view="action"
                                    size="m"
                                    onClick={handleApplyResult}
                                >
                                    {replaceButtonText}
                                </Button>
                            </ActionTooltip>
                        </div>
                    </>
                )}
            </>
        );
    }

    return <div className={cnGptDialog()}> {content} </div>;
};
