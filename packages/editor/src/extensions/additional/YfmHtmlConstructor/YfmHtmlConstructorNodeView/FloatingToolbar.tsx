import {useEffect, useState} from 'react';
import type {FC, ReactNode} from 'react';

import {Code, Copy, Ellipsis, TrashBin} from '@gravity-ui/icons';
import {Button, Dialog, Icon, Popup, useThemeType} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {useElementState} from 'src/react-utils/hooks';

import {getNextQuickStyle} from '../quickStyle';
import {getEnabledHtmlConstructorSettings} from '../settings';
import type {
    HtmlConstructorColorTheme,
    HtmlConstructorQuickStyle,
    HtmlConstructorTemplateSettings,
} from '../types';

import {cnYfmHtmlConstructor as b, STOP_EVENT_CLASSNAME as stop} from './const';
import {BorderControl, ColorControl} from './toolbar/QuickStyleControls';
import {ToolbarButton, type ToolbarButtonProps} from './toolbar/ToolbarButton';
import {type ToolbarAction, useToolbarLayout} from './toolbar/useToolbarLayout';

export type FloatingToolbarPrimaryAction = ToolbarButtonProps & {id: string};
type StyleMenu = 'background' | 'textColor' | 'border';

type FloatingToolbarProps = {
    settings?: HtmlConstructorTemplateSettings;
    quickStyle?: HtmlConstructorQuickStyle;
    onQuickStyleChange: (quickStyle: HtmlConstructorQuickStyle) => void;
    /** Disable styling and code editing for an empty constructor. */
    styleDisabled?: boolean;
    /** Collapse controls that do not fit inside the block. */
    constrainToParent?: boolean;
    onOpenSettings: () => void;
    primaryActions?: FloatingToolbarPrimaryAction[];
    onDuplicate?: () => void;
    onRemove?: () => void;
    expandedContent?: ReactNode;
    expandedContentView?: 'menu' | 'editor' | 'panel';
    onCloseExpandedContent?: () => void;
    codeLabel: string;
    duplicateLabel?: string;
    removeLabel: string;
};

export const FloatingToolbar: FC<FloatingToolbarProps> = ({
    settings,
    quickStyle,
    onQuickStyleChange,
    styleDisabled = false,
    onOpenSettings,
    primaryActions = [],
    onDuplicate,
    onRemove,
    expandedContent,
    expandedContentView = 'menu',
    onCloseExpandedContent,
    codeLabel,
    duplicateLabel,
    removeLabel,
    constrainToParent = false,
}) => {
    const enabled = getEnabledHtmlConstructorSettings(settings);
    const activeTheme = useThemeType() === 'dark' ? 'dark' : 'light';
    const [paletteTheme, setPaletteTheme] = useState<HtmlConstructorColorTheme>(activeTheme);
    const [openMenu, setOpenMenu] = useState<StyleMenu | null>(null);
    const [moreAnchor, setMoreAnchor] = useElementState<HTMLButtonElement>();
    const [moreOpen, setMoreOpen] = useState(false);
    const settingsSelected = Boolean(expandedContent) && expandedContentView === 'editor';

    useEffect(() => setPaletteTheme(activeTheme), [activeTheme]);

    const closeMenus = () => {
        setOpenMenu(null);
        setMoreOpen(false);
    };
    const runAction = (action: () => void) => () => {
        closeMenus();
        action();
    };
    const setMenuOpen = (menu: StyleMenu, open: boolean) => {
        setOpenMenu((current) => (open ? menu : current === menu ? null : current));
    };
    const updateQuickStyle = (patch: Partial<HtmlConstructorQuickStyle>) =>
        onQuickStyleChange(getNextQuickStyle(quickStyle, patch));

    const actions: ToolbarAction[] = primaryActions.map(({id, ...button}) => ({
        id,
        group: 'primary',
        node: <ToolbarButton {...button} iconSize={16} />,
    }));
    if (enabled.hasRaw)
        actions.push({
            id: 'raw',
            group: 'primary',
            node: (
                <ToolbarButton
                    icon={Code}
                    label={codeLabel}
                    disabled={styleDisabled}
                    selected={settingsSelected}
                    onClick={runAction(onOpenSettings)}
                />
            ),
        });
    for (const kind of ['background', 'textColor'] as const) {
        if (!(kind === 'background' ? enabled.hasBackground : enabled.hasTextColor)) continue;
        actions.push({
            id: kind,
            group: 'style',
            node: (
                <ColorControl
                    kind={kind}
                    value={quickStyle?.[kind]}
                    disabled={styleDisabled}
                    activeTheme={activeTheme}
                    paletteTheme={paletteTheme}
                    onPaletteThemeChange={setPaletteTheme}
                    open={openMenu === kind}
                    onOpenChange={(open) => setMenuOpen(kind, open)}
                    onChange={(color) => updateQuickStyle({[kind]: color})}
                />
            ),
        });
    }
    if (enabled.hasBorder || enabled.hasRound)
        actions.push({
            id: 'border',
            group: 'style',
            node: (
                <BorderControl
                    value={quickStyle}
                    disabled={styleDisabled}
                    hasBorder={enabled.hasBorder}
                    hasRound={enabled.hasRound}
                    open={openMenu === 'border'}
                    onOpenChange={(open) => setMenuOpen('border', open)}
                    onChange={(patch) => {
                        updateQuickStyle(patch);
                        closeMenus();
                    }}
                />
            ),
        });
    if (onDuplicate && duplicateLabel)
        actions.push({
            id: 'duplicate',
            group: 'actions',
            node: (
                <ToolbarButton
                    icon={Copy}
                    label={duplicateLabel}
                    onClick={runAction(onDuplicate)}
                />
            ),
        });
    if (enabled.hasDelete && onRemove)
        actions.push({
            id: 'delete',
            group: 'actions',
            node: (
                <ToolbarButton
                    icon={TrashBin}
                    label={removeLabel}
                    view="flat-danger"
                    onClick={runAction(onRemove)}
                />
            ),
        });
    const {toolbarRef, rowRef, visibleGroups, hiddenGroups} = useToolbarLayout(
        actions,
        constrainToParent,
    );

    return (
        <div
            ref={toolbarRef}
            data-hc-ui
            className={b(
                'floating-toolbar',
                {
                    open: openMenu !== null || moreOpen || Boolean(expandedContent),
                },
                [stop],
            )}
        >
            <div ref={rowRef} className={b('floating-toolbar-row', [stop])}>
                {visibleGroups.map(({group, actions}) => (
                    <div key={group} className={b('floating-toolbar-group', {group}, [stop])}>
                        {actions.map((action) => (
                            <div
                                key={action.id}
                                className={b('floating-toolbar-item', [stop])}
                                data-toolbar-action-id={action.id}
                            >
                                {action.node}
                            </div>
                        ))}
                    </div>
                ))}
                {hiddenGroups.length > 0 && (
                    <div className={b('floating-toolbar-group', {more: true}, [stop])}>
                        <div className={b('floating-toolbar-item', {more: true}, [stop])}>
                            <Button
                                ref={setMoreAnchor}
                                view="flat"
                                size="s"
                                className={stop}
                                onClick={() => setMoreOpen((open) => !open)}
                                aria-label={i18n('more_actions')}
                            >
                                <Icon data={Ellipsis} size={14} className={stop} />
                            </Button>
                            <Popup
                                anchorElement={moreAnchor}
                                open={moreOpen}
                                onOpenChange={(open) => {
                                    setMoreOpen(open);
                                    if (!open) setOpenMenu(null);
                                }}
                                placement="bottom-end"
                            >
                                <div className={b('floating-menu', {overflow: true}, [stop])}>
                                    {hiddenGroups.map(({group, actions}) => (
                                        <div
                                            key={group}
                                            className={b('floating-menu-group', [stop])}
                                        >
                                            {actions.map((action) => (
                                                <div
                                                    key={action.id}
                                                    className={b('floating-menu-item', [stop])}
                                                >
                                                    {action.node}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </Popup>
                        </div>
                    </div>
                )}
            </div>
            {expandedContent && (
                <Dialog
                    open
                    hasCloseButton={false}
                    className={b('dialog', [stop])}
                    modalClassName={b('modal', [stop])}
                    aria-label={settingsSelected ? codeLabel : i18n('structure_templates')}
                    disableHeightTransition
                    onClose={runAction(() => onCloseExpandedContent?.())}
                >
                    {expandedContent}
                </Dialog>
            )}
            <div className={b('floating-toolbar-tail', [stop])} />
        </div>
    );
};
