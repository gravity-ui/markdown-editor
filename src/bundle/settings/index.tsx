/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import {Eye, Gear, LogoMarkdown} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Checkbox,
    Icon,
    Menu,
    Popup,
    PopupPlacement,
} from '@gravity-ui/uikit';

import {ClassNameProps, cn} from '../../classname';
import {i18n} from '../../i18n/bundle';
import WysiwygModeIcon from '../../icons/WysiwygMode';
import {noop} from '../../lodash';
import {useBooleanState} from '../../react-utils/hooks';
import {ToolbarTooltipDelay} from '../../toolbar';
import {VERSION} from '../../version';
import type {EditorMode, SplitMode} from '../Editor';

import {MarkdownHints} from './MarkdownHints';

import './index.scss';

const placement: PopupPlacement = ['bottom-end', 'top-end'];

const bSettings = cn('editor-settings');
const bContent = cn('settings-content');

export type EditorSettingsProps = SettingsContentProps & {renderPreviewButton?: boolean};

export const EditorSettings = React.memo<EditorSettingsProps>(function EditorSettings(props) {
    const {className, onShowPreviewChange, showPreview, renderPreviewButton} = props;
    const chevronRef = React.useRef<HTMLButtonElement>(null);
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
                    <div className={bSettings('separator')} />
                </>
            )}
            <Button
                size="m"
                view="flat"
                ref={chevronRef}
                pin="round-round"
                onClick={togglePopup}
                className={bSettings('dropdown-button')}
            >
                <Icon data={Gear} />
            </Button>
            <Popup
                open={popupShown}
                anchorRef={chevronRef}
                placement={placement}
                onClose={hidePopup}
            >
                <SettingsContent {...props} className={bSettings('content')} />
            </Popup>
        </div>
    );
});

type SettingsContentProps = ClassNameProps & {
    mode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
    onShowPreviewChange: (showPreview: boolean) => void;
    showPreview: boolean;
    toolbarVisibility: boolean;
    onToolbarVisibilityChange: (val: boolean) => void;
    splitMode?: SplitMode;
    splitModeEnabled?: boolean;
    onSplitModeChange?: (splitModeEnabled: boolean) => void;
};

const mdHelpPlacement: PopupPlacement = ['bottom', 'bottom-end', 'right-start', 'right', 'left'];

const SettingsContent: React.FC<SettingsContentProps> = function SettingsContent({
    mode,
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
                    onClick={() => onModeChange('wysiwyg')}
                    icon={<Icon data={WysiwygModeIcon} />}
                >
                    {i18n('settings_wysiwyg')}
                </Menu.Item>
                <Menu.Item
                    active={mode === 'markup'}
                    onClick={() => onModeChange('markup')}
                    icon={<Icon data={LogoMarkdown} />}
                >
                    {i18n('settings_markup')}
                    <HelpPopover
                        content={
                            <div
                                onClick={(e) => {
                                    // stop clicks propagation
                                    // because otherwise click in MarkdownHints handled as click on MenuItem
                                    e.stopPropagation();
                                }}
                            >
                                <MarkdownHints />
                            </div>
                        }
                        placement={mdHelpPlacement}
                        className={bContent('mode-help')}
                    />
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
