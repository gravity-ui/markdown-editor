/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import {memo, useState} from 'react';

import {Eye, Gear, LogoMarkdown} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Box,
    Button,
    Checkbox,
    type CheckboxProps,
    HelpMark,
    Icon,
    Menu,
    Popup,
    type PopupPlacement,
    type QAProps,
    Text,
    sp,
} from '@gravity-ui/uikit';

import {LAYOUT} from 'src/common/layout';

import {type ClassNameProps, cn} from '../../classname';
import {i18n} from '../../i18n/bundle';
import WysiwygModeIcon from '../../icons/WysiwygMode';
import {noop} from '../../lodash';
import {useTargetZIndex} from '../../react-utils';
import {useBooleanState} from '../../react-utils/hooks';
import {ToolbarTooltipDelay} from '../../toolbar';
import {VERSION} from '../../version';
import type {MarkdownEditorMode, MarkdownEditorSplitMode} from '../types';

import {MarkdownHints} from './MarkdownHints';

import './index.scss';

const placement: PopupPlacement = ['bottom-end', 'top-end'];

const bSettings = cn('editor-settings');
const bContent = cn('settings-content');

export type EditorSettingsProps = Omit<SettingsContentProps, 'onClose' | 'zIndex'> & {
    renderPreviewButton?: boolean;
    settingsVisible?: boolean | SettingItems[];
};

export const EditorSettings = memo<EditorSettingsProps>(function EditorSettings(props) {
    const {className, onShowPreviewChange, showPreview, renderPreviewButton, settingsVisible} =
        props;
    const [chevronElement, setChevronElement] = useState<HTMLButtonElement | null>(null);
    const [popupShown, , hidePopup, togglePopup] = useBooleanState(false);
    const zIndex = useTargetZIndex(LAYOUT.STICKY_TOOLBAR);

    const areSettingsVisible =
        settingsVisible === true || (Array.isArray(settingsVisible) && settingsVisible.length > 0);

    return (
        <div className={bSettings(null, className)}>
            {renderPreviewButton && (
                <>
                    <ActionTooltip
                        openDelay={ToolbarTooltipDelay.Open}
                        closeDelay={ToolbarTooltipDelay.Close}
                        title={i18n('preview_label')}
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
                            aria-label={i18n('preview_label')}
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
                        aria-label={i18n('settings_label')}
                    >
                        <Icon data={Gear} />
                    </Button>
                    <Popup
                        open={popupShown}
                        anchorElement={chevronElement}
                        placement={placement}
                        onOpenChange={hidePopup}
                        zIndex={zIndex}
                    >
                        <SettingsContent
                            {...props}
                            qa="g-md-settings-content"
                            onClose={hidePopup}
                            className={bSettings('content')}
                            zIndex={zIndex}
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
        zIndex?: number;
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
    zIndex,
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
                                    zIndex,
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
                <CheckboxWithHint
                    checked={toolbarVisibility}
                    className={bContent('toolbar')}
                    onUpdate={onToolbarVisibilityChange}
                    title={i18n('settings_menubar')}
                    hint={i18n('settings_hint')}
                />
            )}
            {showSplitModeSetting && splitMode && (
                <CheckboxWithHint
                    checked={splitModeEnabled}
                    disabled={mode !== 'markup'}
                    className={bContent('split-mode')}
                    onUpdate={onSplitModeChange ?? noop}
                    title={i18n('settings_split-mode')}
                    hint={i18n('settings_split-mode-hint')}
                />
            )}
            <Text variant="code-inline-1" className={bContent('version')}>
                {VERSION}
            </Text>
        </div>
    );
};

type CheckboxWithHintProps = {
    checked?: boolean;
    disabled?: boolean;
    onUpdate: CheckboxProps['onUpdate'];
    title: string;
    hint: string;
    className: string;
};

function CheckboxWithHint({
    checked,
    disabled,
    onUpdate,
    title,
    hint,
    className,
}: CheckboxWithHintProps) {
    return (
        <Box spacing={{px: 4, pt: 2, pb: 3}} className={bContent('check-box', className)}>
            <Checkbox size="m" disabled={disabled} checked={checked} onUpdate={onUpdate}>
                {title}
            </Checkbox>
            <Text as="div" color="secondary" className={bContent('check-hint', sp({mt: 1, pl: 6}))}>
                {hint}
            </Text>
        </Box>
    );
}
