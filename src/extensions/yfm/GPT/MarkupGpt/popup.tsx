import React from 'react';

import {Popup, PopupProps} from '@gravity-ui/uikit';

import {CommonAnswer} from '../ErrorScreen/types';
import {GptDialog, GptDialogProps} from '../GptDialog/GptDialog';
import {cnGptPopup} from '../gptExtension/view';

type Props = {
    onClose: () => void;
    markup: string;
    onConfirmOk?: () => void;
    onConfirmCancel?: () => void;
} & GptDialogProps &
    Pick<PopupProps, 'anchorRef' | 'container'>;

export function renderPopup(anchor: HTMLElement, props: Props) {
    const handleUpdate = (result?: CommonAnswer) => props.onUpdate?.(result);

    return (
        <Popup
            className={cnGptPopup()}
            contentClassName={cnGptPopup('content')}
            open
            anchorRef={{current: anchor}}
            onOutsideClick={props.onClose}
            focusTrap
            strategy="absolute"
            onEscapeKeyDown={props.onClose}
        >
            <GptDialog
                markup={props.markup}
                answerRender={props.answerRender}
                promptPresets={props.promptPresets}
                disablePromptPresets={props.disablePromptPresets}
                customPromptPlaceholder={props.customPromptPlaceholder}
                disabledPromptPlaceholder={props.disabledPromptPlaceholder}
                onApplyResult={props.onApplyResult}
                onCustomPromptApply={props.onCustomPromptApply}
                onPromptPresetClick={props.onPromptPresetClick}
                onTryAgain={props.onTryAgain}
                onLike={props.onLike}
                onDislike={props.onDislike}
                onClose={props.onClose}
                onUpdate={handleUpdate}
                gptAlertProps={props.gptAlertProps}
            />
        </Popup>
    );
}
