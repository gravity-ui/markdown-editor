import type React from 'react';

import {i18n} from '../../../i18n/gpt/dialog';

import {CommonAnswer} from './ErrorScreen/types';
import {GptDialogProps} from './GptDialog/GptDialog';
import {GptWidgetOptions} from './gptExtension/gptExtension';

type CombinedKeyboardEvent = KeyboardEvent | React.KeyboardEvent;

export function getAlertGptInfo(gptAlert: GptDialogProps['gptAlertProps']) {
    return {
        alertMessage: gptAlert?.message || i18n('alert-gpt-presets-info'),
        alertTheme: gptAlert?.theme || 'info',
        alertClassName: gptAlert?.className,
    };
}

export function getDisableReplaceButtonText(disablePromptPresets?: boolean) {
    return disablePromptPresets ? i18n(`replace-disabled`) : i18n(`replace`);
}

export function getInputPlaceHolder(
    disablePromptPresets?: boolean,
    disabledPromptPlaceholder?: string,
    customPromptPlaceholder?: string,
) {
    return disablePromptPresets ? disabledPromptPlaceholder : customPromptPlaceholder;
}

export const isEnter = (event: CombinedKeyboardEvent) =>
    event.code === 'Enter' || event.code === 'NumpadEnter';

export function focusWithoutScroll(element?: HTMLElement | null) {
    const x = window.scrollX;
    const y = window.scrollY;

    element?.focus({
        preventScroll: true,
    });

    window.scrollTo(x, y);
}

export function isEmptyGptPrompts<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(gptWidgetOptions: GptWidgetOptions<AnswerData, PromptData>, disablePromptPresets: boolean) {
    if (disablePromptPresets && !gptWidgetOptions.onCustomPromptApply) return true;

    if (
        !disablePromptPresets &&
        !gptWidgetOptions.promptPresets?.length &&
        !gptWidgetOptions.onCustomPromptApply
    )
        return true;

    return false;
}
