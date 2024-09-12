import type {PopupProps} from '@gravity-ui/uikit/build/esm/components/Popup/Popup';

export const WIDGET_DECO_CLASS_NAME = 'g-md-gpt-widget-deco';
export const WIDGET_DECO_SPEC_FLAG = 'gpt_widget_deco';
export const gptPopupPlacement: PopupProps['placement'] = ['bottom-start', 'top-start'];

export const gptHotKeys = {
    openGptKey: 'Mod-h',
    openGptKeyTooltip: 'Mod+h',
    presetsKey: (key: string) => `Control+${key}`,
    tryAgainGpt: 'Control+t',
    freshStartGpt: 'Control+r',
    applyResultGpt: 'Enter',
    closeGpt: 'Escape',
};
