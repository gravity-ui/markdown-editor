import type {RefObject} from 'react';

import {ArrowRight} from '@gravity-ui/icons';
import {Alert, Button, Icon, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../i18n/dialog';
import gptIcon from '../../icons/GPT';
import type {CommonAnswer, GptDialogProps} from '../../types';
import {getAlertGptInfo, getInputPlaceHolder} from '../../utils';
import {IconRefuge} from '../IconRefuge';
import {PresetList} from '../PresetList/PresetList';

import {cnGptDialog} from './classname';

type Props<A extends CommonAnswer, P> = Pick<
    GptDialogProps<A, P>,
    | 'promptPresets'
    | 'disablePromptPresets'
    | 'customPromptPlaceholder'
    | 'disabledPromptPlaceholder'
    | 'gptAlertProps'
> & {
    alertDismissed: boolean;
    onCloseAlert: () => void;
    allowCustomPrompt: boolean;
    prompt: string;
    inputRef: RefObject<HTMLInputElement>;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    onPresetClick: (data?: P) => void;
};

export function GptPrompt<A extends CommonAnswer, P>({
    promptPresets,
    disablePromptPresets,
    customPromptPlaceholder,
    disabledPromptPlaceholder,
    gptAlertProps,
    alertDismissed,
    onCloseAlert,
    allowCustomPrompt,
    prompt,
    inputRef,
    onPromptChange,
    onSubmit,
    onPresetClick,
}: Props<A, P>) {
    const alert = getAlertGptInfo(gptAlertProps);
    const placeholder = getInputPlaceHolder(
        disablePromptPresets,
        disabledPromptPlaceholder,
        customPromptPlaceholder,
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
                {allowCustomPrompt ? (
                    <div className={cnGptDialog('custom-prompt')}>
                        <TextInput
                            controlRef={inputRef}
                            value={prompt}
                            view="clear"
                            size="m"
                            className={cnGptDialog('custom-prompt-input')}
                            placeholder={placeholder}
                            onUpdate={onPromptChange}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onSubmit();
                                }
                            }}
                        />
                        <Button
                            className={cnGptDialog('custom-prompt-ask-button')}
                            view="normal"
                            size="s"
                            aria-label={i18n('submit-prompt')}
                            disabled={!prompt.trim()}
                            onClick={onSubmit}
                        >
                            <Icon data={ArrowRight} size={16} />
                        </Button>
                    </div>
                ) : (
                    <div className={cnGptDialog('alone-presets')}>
                        <span className={cnGptDialog('alone-presets-text')}>
                            {i18n('only-presets-title')}
                        </span>
                    </div>
                )}
            </div>
            {Boolean(promptPresets?.length) && !disablePromptPresets && (
                <div className={cnGptDialog('header-bottom')}>
                    <PresetList promptPresets={promptPresets} onPresetClick={onPresetClick} />
                </div>
            )}
            {disablePromptPresets && gptAlertProps?.showedGptAlert && !alertDismissed && (
                <Alert
                    theme={alert.alertTheme}
                    message={alert.alertMessage}
                    align="center"
                    className={cnGptDialog('description-alert', alert.alertClassName)}
                    onClose={onCloseAlert}
                />
            )}
        </div>
    );
}
