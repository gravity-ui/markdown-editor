import {ArrowRight, ArrowRotateLeft} from '@gravity-ui/icons';
import {ActionTooltip, Alert, Button, Icon, TextInput} from '@gravity-ui/uikit';

import type {CommonAnswer} from '../ErrorScreen/types';
import {IconRefuge} from '../IconRefuge/IconRefuge';
import {PresetList} from '../PresetList/PresetList';
import {gptHotKeys} from '../constants';
import type {GptSession} from '../hooks/useGpt';
import {i18n} from '../i18n/dialog';
import gptIcon from '../icons/GPT';
import type {GptDialogProps} from '../types';
import {getAlertGptInfo, getInputPlaceHolder} from '../utils';

import {cnGptDialog} from './classname';

type Props<A extends CommonAnswer, P> = GptDialogProps<A, P> & {
    session: GptSession<A, P>;
    showedGptAlert?: boolean;
    onCloseAlert: () => void;
};

export function GptPrompt<A extends CommonAnswer, P>({
    session,
    promptPresets,
    disablePromptPresets,
    customPromptPlaceholder,
    disabledPromptPlaceholder,
    gptAlertProps,
    promptRef,
    showedGptAlert,
    onCloseAlert,
}: Props<A, P>) {
    const {
        mode,
        showAnswer,
        showTryAgainButton,
        customPrompt,
        handleCustomPromptKeyPress,
        handleCustomPromptUpdate,
        handleCustomPromptApply,
        handlePresetClick,
        handleTryAgain,
        handleFreshStart,
    } = session;
    const {alertMessage, alertTheme, alertClassName} = getAlertGptInfo(gptAlertProps);
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

    return (
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
                        <span className={cnGptDialog('answer-title')}>{i18n('answer-title')}</span>
                    ) : (
                        <div className={cnGptDialog('custom-prompt')}>
                            <TextInput
                                controlRef={promptRef}
                                value={customPrompt}
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
    );
}
