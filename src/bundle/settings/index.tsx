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
} from '@gravity-ui/uikit';

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
    settingsVisible?: boolean;
};

export const EditorSettings = memo<EditorSettingsProps>(function EditorSettings(props) {
    const {className, onShowPreviewChange, showPreview, renderPreviewButton, settingsVisible} =
        props;
    const [chevronElement, setChevronElement] = useState<HTMLButtonElement | null>(null);
    const [popupShown, , hidePopup, togglePopup] = useBooleanState(false);

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
            {settingsVisible && (
                <>
                    <Button
                        size="m"
                        view="flat"
                        pin="round-round"
                        onClick={togglePopup}
                        ref={setChevronElement}
                        className={bSettings('dropdown-button')}
                    >
                        <Icon data={Gear} />
                    </Button>
                    <Popup
                        open={popupShown}
                        anchorElement={chevronElement}
                        placement={placement}
                        onOpenChange={hidePopup}
                    >
                        <SettingsContent
                            {...props}
                            onClose={hidePopup}
                            className={bSettings('content')}
                        />
                    </Popup>
                </>
            )}
        </div>
    );
});

type SettingsContentProps = ClassNameProps & {
    mode: MarkdownEditorMode;
    onClose: () => void;
    onModeChange: (mode: MarkdownEditorMode) => void;
    onShowPreviewChange: (showPreview: boolean) => void;
    showPreview: boolean;
    toolbarVisibility: boolean;
    onToolbarVisibilityChange: (val: boolean) => void;
    splitMode?: MarkdownEditorSplitMode;
    splitModeEnabled?: boolean;
    onSplitModeChange?: (splitModeEnabled: boolean) => void;
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
}) {
    return (
        <div className={bContent(null, [className])}>
            <Menu size="l" className={bContent('mode')}>
                <Menu.Item
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
                    active={mode === 'markup'}
                    onClick={() => {
                        onModeChange('markup');
                        onClose();
                    }}
                    iconStart={<Icon data={LogoMarkdown} />}
                >
                    {i18n('settings_markup')}
                    <HelpMark
                        popoverProps={{
                            placement: mdHelpPlacement,
                            modal: false,
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
                </Menu.Item>
            </Menu>
            <div className={bContent('separator')} />
            {!showPreview && (
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
            {splitMode && (
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
