// Compatibility exports for existing editor subpaths. Prefer the mode entry points.
export {runGpt} from './wysiwyg/extensions/GPT/commands';
export {
    getAlertGptInfo,
    getDisableReplaceButtonText,
    getInputPlaceHolder,
    isEnter,
    focusWithoutScroll,
    isEmptyGptPrompts,
} from './utils';
export {type GptDialogProps, type GptWidgetOptions, type PresetListProps} from './types';
export {
    WIDGET_DECO_CLASS_NAME,
    WIDGET_DECO_SPEC_FLAG,
    gptPopupPlacement,
    gptHotKeys,
} from './constants';
export {type GptWidgetMeta, pluginKey} from './wysiwyg/extensions/GPT/plugin-key';
export {showMarkupGpt, hideMarkupGpt, runMarkupGpt} from './markup/commands/gpt';
export {renderPopup} from './markup/popup';
export {ShowMarkupGptEffect, HideMarkupGptEffect} from './markup/effects';
export {cnGptDialog, GptDialog} from './components/GptDialog/GptDialog';
export {usePresetList} from './hooks/usePresetList';
export {useGpt} from './hooks/useGpt';
export {useGptHotKeys} from './hooks/useGptHotKeys';
export {
    type UseOverflowingContainerListItemsProps,
    useOverflowingHorizontalItems,
} from './hooks/useOverflowingHorizontalItems';
export {cnIconRefuge} from './components/IconRefuge/IconRefuge.classname';
export {type IconRefugeProps} from './components/IconRefuge/IconRefuge.types';
export {IconRefuge} from './components/IconRefuge/IconRefuge';
export {cnGptDialogPresetList} from './components/PresetList/classname';
export {PresetList} from './components/PresetList/PresetList';
export {cnGptDialogErrorScreen, ErrorScreen} from './components/ErrorScreen/ErrorScreen';
export {type PromptPreset, type CommonAnswer, type GptRequestData} from './types';
export {
    cnGptDialogLoadingScreen,
    LoadingScreen,
} from './components/GptDialog/LoadingScreen/LoadingScreen';
export {i18n as extensionI18n, type I18nKey as ExtensionI18nKey} from './i18n/extension/index';
export {i18n as loadingI18n, type I18nKey as LoadingI18nKey} from './i18n/loading/index';
export {i18n as dialogI18n, type I18nKey as DialogI18nKey} from './i18n/dialog/index';
export {i18n as errorsI18n, type I18nKey as ErrorsI18nKey} from './i18n/errors/index';
export {default as GPT} from './icons/GPT';
export {default as GPTLoading} from './icons/GPTLoading';
export {
    GptWidgetDecoView,
    type GptWidgetDecoViewParams,
    cnGptPopup,
} from './wysiwyg/extensions/GPT/view';
