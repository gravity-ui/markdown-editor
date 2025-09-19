/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import {memo, useState} from 'react';

import {Eye, Gear, LogoMarkdown} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Checkbox,
    HelpMark,
    Icon,
    Menu,
    Popup,
    type PopupPlacement,
    type QAProps,
} from '@gravity-ui/uikit';

import {CLASSNAME_BY_LAYER_MAP} from 'src/common/layersMap';
import {getTargetZIndex} from 'src/utils/get-target-z-index';

import {type ClassNameProps, cn} from '../../classname';
import {i18n} from '../../i18n/bundle';
import WysiwygModeIcon from '../../icons/WysiwygMode';
import {noop} from '../../lodash';
import {useBooleanState} from '../../react-utils/hooks';
import {ToolbarTooltipDelay} from '../../toolbar';
import {VERSION} from '../../version';
import type {MarkdownEditorMode, MarkdownEditorSplitMode} from '../types';

import {MarkdownHints} from './MarkdownHints';

import './index.scss';

const placement: PopupPlacement = ['bottom-end', 'top-end'];

const bSettings = cn('editor-settings');
const bContent = cn('settings-content');

export type EditorSettingsProps = Omit<SettingsContentProps, 'onClose'> & {
    renderPreviewButton?: boolean;
    settingsVisible?: boolean | SettingItems[];
};

export const EditorSettings = memo<EditorSettingsProps>(function EditorSettings(props) {
    const {className, onShowPreviewChange, showPreview, renderPreviewButton, settingsVisible} =
        props;
    const [chevronElement, setChevronElement] = useState<HTMLButtonElement | null>(null);
    const [popupShown, , hidePopup, togglePopup] = useBooleanState(false);

    const areSettingsVisible =
        settingsVisible === true || (Array.isArray(settingsVisible) && settingsVisible.length > 0);

    return (
        <div className={bSettings(null, [className])}>
            {renderPreviewButton && (
                <>
                    <ActionTooltip
                        openDelay={ToolbarTooltipDelay.Open}
                        closeDelay={ToolbarTooltipDelay.Close}
                        title={i18n('preview_hint')}
                        hotkey="mod+shift+p"
                    >
                        <Button
                            qa="g-md-markup-preview-button"
                            size="m"
                            view="flat"
                            pin="round-round"
                            className={bSettings('preview-button')}
                            onClick={() => onShowPreviewChange?.(!showPreview)}
                            selected={showPreview}
                        >
                            <Icon data={Eye} />
                        </Button>
                    </ActionTooltip>
                    {settingsVisible && <div className={bSettings('separator')} />}
                </>
            )}
            {areSettingsVisible && (
                <>
                    <Button
                        size="m"
                        view="flat"
                        pin="round-round"
                        onClick={togglePopup}
                        ref={setChevronElement}
                        qa="g-md-settings-button"
                        className={bSettings('dropdown-button')}
                    >
                        <Icon data={Gear} />
                    </Button>
                    <Popup
                        open={popupShown}
                        anchorElement={chevronElement}
                        placement={placement}
                        onOpenChange={hidePopup}
                        zIndex={getTargetZIndex(CLASSNAME_BY_LAYER_MAP.STICKY_TOOLBAR)}
                    >
                        <SettingsContent
                            {...props}
                            qa="g-md-settings-content"
                            onClose={hidePopup}
                            className={bSettings('content')}
                        />
                    </Popup>
                </>
            )}
        </div>
    );
});

export type SettingItems = 'mode' | 'toolbar' | 'split';

type SettingsContentProps = ClassNameProps &
    QAProps & {
        mode: MarkdownEditorMode;
        onClose: () => void;
        onModeChange: (mode: MarkdownEditorMode) => void;
        onShowPreviewChange: (showPreview: boolean) => void;
        showPreview: boolean;
        toolbarVisibility: boolean;
        settingsVisible?: SettingItems[] | boolean;
        onToolbarVisibilityChange: (val: boolean) => void;
        splitMode?: MarkdownEditorSplitMode;
        splitModeEnabled?: boolean;
        onSplitModeChange?: (splitModeEnabled: boolean) => void;
        disableMark?: boolean;
    };

const mdHelpPlacement: PopupPlacement = ['bottom', 'bottom-end', 'right-start', 'right', 'left'];

const SettingsContent: React.FC<SettingsContentProps> = function SettingsContent({
    mode,
    onClose,
    onModeChange,
    toolbarVisibility,
    onToolbarVisibilityChange,
    onSplitModeChange,
    splitMode = false,
    splitModeEnabled,
    className,
    showPreview,
    settingsVisible,
    qa,
    disableMark,
}) {
    const isSettingsArray = Array.isArray(settingsVisible);
    const showModeSetting = isSettingsArray ? settingsVisible?.includes('mode') : true;
    const showToolbarSetting = isSettingsArray ? settingsVisible?.includes('toolbar') : true;
    const showSplitModeSetting = isSettingsArray ? settingsVisible?.includes('split') : true;

    return (
        <div className={bContent(null, [className])} data-qa={qa}>
            {showModeSetting && (
                <Menu size="l" className={bContent('mode')}>
                    <Menu.Item
                        qa="g-md-settings-mode-wysiwyg"
                        active={mode === 'wysiwyg'}
                        onClick={() => {
                            onModeChange('wysiwyg');
                            onClose();
                        }}
                        iconStart={<Icon data={WysiwygModeIcon} />}
                    >
                        {i18n('settings_wysiwyg')}
                    </Menu.Item>
                    <Menu.Item
                        qa="g-md-settings-mode-markup"
                        active={mode === 'markup'}
                        onClick={() => {
                            onModeChange('markup');
                            onClose();
                        }}
                        iconStart={<Icon data={LogoMarkdown} />}
                    >
                        {i18n('settings_markup')}
                        {!disableMark && (
                            <HelpMark
                                popoverProps={{
                                    placement: mdHelpPlacement,
                                    modal: false,
                                    zIndex: getTargetZIndex(
                                        CLASSNAME_BY_LAYER_MAP.STICKY_TOOLBAR,
                                        20,
                                    ),
                                }}
                                className={bContent('mode-help')}
                            >
                                <div
                                    onClick={(e) => {
                                        // stop clicks propagation
                                        // because otherwise click in MarkdownHints handled as click on MenuItem
                                        e.stopPropagation();
                                    }}
                                >
                                    <MarkdownHints />
                                </div>
                            </HelpMark>
                        )}
                    </Menu.Item>
                </Menu>
            )}
            {showModeSetting && (showSplitModeSetting || showToolbarSetting) && (
                <div className={bContent('separator')} />
            )}
            {showToolbarSetting && !showPreview && (
                <div className={bContent('toolbar')}>
                    <Checkbox
                        size="m"
                        checked={toolbarVisibility}
                        onUpdate={onToolbarVisibilityChange}
                    >
                        {i18n('settings_menubar')}
                    </Checkbox>
                    <div className={bContent('toolbar-hint')}>{i18n('settings_hint')}</div>
                </div>
            )}
            {showSplitModeSetting && splitMode && (
                <div className={bContent('split-mode')}>
                    <Checkbox
                        size="m"
                        disabled={mode !== 'markup'}
                        checked={splitModeEnabled}
                        onUpdate={onSplitModeChange ?? noop}
                    >
                        {i18n('settings_split-mode')}
                    </Checkbox>
                    <div className={bContent('toolbar-hint')}>
                        {i18n('settings_split-mode-hint')}
                    </div>
                </div>
            )}
            <span className={bContent('version')}>{VERSION}</span>
        </div>
    );
};
