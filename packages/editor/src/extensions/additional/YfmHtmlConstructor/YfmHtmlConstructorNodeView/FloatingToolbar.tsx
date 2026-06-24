import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties, FC, MouseEvent, ReactNode} from 'react';

import {
    BucketPaint,
    ChevronDown,
    Code,
    Copy,
    Ellipsis,
    Font,
    Lock,
    SquareDashedText,
    TrashBin,
} from '@gravity-ui/icons';
import {Button, Icon, Popup, useThemeType} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {useElementState} from 'src/react-utils/hooks';

import {
    HTML_CONSTRUCTOR_BACKGROUND_COLORS,
    HTML_CONSTRUCTOR_BORDER_RADIUS,
    HTML_CONSTRUCTOR_BORDER_STYLES,
    HTML_CONSTRUCTOR_COLOR_NAME_KEYS,
    HTML_CONSTRUCTOR_TEXT_COLORS,
    setThemedColor,
} from '../quickStyle';
import {getEnabledHtmlConstructorSettings} from '../settings';
import type {
    HtmlConstructorBorderStyle,
    HtmlConstructorColorTheme,
    HtmlConstructorQuickStyle,
    HtmlConstructorTemplateSettings,
} from '../types';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const TOOLBAR_MAX_WIDTH_RATIO = 0.9;
const TOOLBAR_HORIZONTAL_PADDING = 16;
const TOOLBAR_ITEM_GAP = 4;
const TOOLBAR_GROUP_SEPARATOR_WIDTH = 21;
const MORE_BUTTON_FALLBACK_WIDTH = 32;

type ToolbarMenu = 'background' | 'textColor' | 'border' | null;
type ToolbarActionId = string;
type ToolbarActionGroup = 'primary' | 'style' | 'actions';
type ToolbarAction = {id: ToolbarActionId; group: ToolbarActionGroup; node: ReactNode};
export type FloatingToolbarPrimaryAction = {id: ToolbarActionId; node: ReactNode};

const HIDE_ACTION_ORDER: ToolbarActionId[] = [
    'lock',
    'duplicate',
    'delete',
    'border',
    'palette',
    'textColor',
    'background',
    'raw',
];
const TOOLBAR_GROUP_ORDER: ToolbarActionGroup[] = ['primary', 'style', 'actions'];

type FloatingToolbarProps = {
    settings?: HtmlConstructorTemplateSettings;
    quickStyle?: HtmlConstructorQuickStyle;
    onQuickStyleChange: (quickStyle: HtmlConstructorQuickStyle) => void;
    /** Disable the quick-style zone (background/text color/border) when there is nothing to style yet. */
    styleDisabled?: boolean;
    /**
     * Cap the toolbar width to its positioned parent (the block) instead of the
     * viewport, so a corner-anchored block toolbar collapses extra controls into
     * the overflow menu rather than spilling outside the block.
     */
    constrainToParent?: boolean;
    onOpenSettings: () => void;
    /** Hide the raw/code (open-settings) button. */
    hideRawButton?: boolean;
    primaryActions?: FloatingToolbarPrimaryAction[];
    onDuplicate?: () => void;
    onRemove?: () => void;
    expandedContent?: ReactNode;
    expandedContentView?: 'menu' | 'editor' | 'panel';
    onCloseExpandedContent?: () => void;
    codeLabel: string;
    duplicateLabel?: string;
    removeLabel: string;
    lockLabel?: string;
};

export const getNextQuickStyle = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
    patch: Partial<HtmlConstructorQuickStyle>,
) => {
    const next = {...quickStyle, ...patch};

    for (const key of Object.keys(next) as (keyof HtmlConstructorQuickStyle)[]) {
        if (!next[key]) delete next[key];
    }

    return next;
};

const resolveColorTheme = (theme: string): HtmlConstructorColorTheme =>
    theme === 'dark' ? 'dark' : 'light';

const getColorName = (color: string) => {
    const key = HTML_CONSTRUCTOR_COLOR_NAME_KEYS[color.toLowerCase()];
    return key ? i18n(key as Parameters<typeof i18n>[0]) : color;
};

const getRadiusLabel = (value: string | undefined) => {
    if (!value) return i18n('round_default');
    if (value === '0') return i18n('round_none');
    if (value === '999px') return i18n('round_pill');
    return value;
};

const getBorderLabel = (value: HtmlConstructorBorderStyle | undefined) => {
    if (value === 'solid') return i18n('border_solid');
    if (value === 'dashed') return i18n('border_dashed');
    if (value === 'dotted') return i18n('border_dotted');
    if (value === 'none') return i18n('border_none');

    return i18n('border_default');
};

const getToolbarWidth = (actions: ToolbarAction[], widths: Record<string, number>) => {
    const groupCounts = TOOLBAR_GROUP_ORDER.map(
        (group) => actions.filter((action) => action.group === group).length,
    ).filter(Boolean);

    return (
        actions.reduce((sum, action) => sum + (widths[action.id] ?? 0), 0) +
        groupCounts.reduce((sum, count) => sum + Math.max(0, count - 1) * TOOLBAR_ITEM_GAP, 0) +
        Math.max(0, groupCounts.length - 1) * TOOLBAR_GROUP_SEPARATOR_WIDTH
    );
};

const groupToolbarActions = (actions: ToolbarAction[]) =>
    TOOLBAR_GROUP_ORDER.map((group) => ({
        group,
        actions: actions.filter((action) => action.group === group),
    })).filter(({actions: groupActions}) => groupActions.length > 0);

export const FloatingToolbar: FC<FloatingToolbarProps> = ({
    settings,
    quickStyle,
    onQuickStyleChange,
    styleDisabled = false,
    onOpenSettings,
    hideRawButton = false,
    primaryActions = [],
    onDuplicate,
    onRemove,
    expandedContent,
    expandedContentView = 'menu',
    onCloseExpandedContent,
    codeLabel,
    duplicateLabel,
    removeLabel,
    lockLabel,
    constrainToParent = false,
}) => {
    const enabled = getEnabledHtmlConstructorSettings(settings);
    const activeTheme = resolveColorTheme(useThemeType());
    // The palette edits one theme's color at a time and defaults to the editor's
    // active theme, so switching the editor theme re-targets the palette ("при
    // переключении темы меняется палитра"). The author can still flip the toggle
    // to set the other theme without leaving.
    const [paletteTheme, setPaletteTheme] = useState<HtmlConstructorColorTheme>(activeTheme);
    const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
    const [backgroundAnchor, setBackgroundAnchor] = useElementState<HTMLButtonElement>();
    const [textColorAnchor, setTextColorAnchor] = useElementState<HTMLButtonElement>();
    const [borderAnchor, setBorderAnchor] = useElementState<HTMLButtonElement>();
    const [moreAnchor, setMoreAnchor] = useElementState<HTMLButtonElement>();
    const [moreOpen, setMoreOpen] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const toolbarRowRef = useRef<HTMLDivElement>(null);
    const [availableToolbarWidth, setAvailableToolbarWidth] = useState(Number.POSITIVE_INFINITY);
    const [toolbarItemWidths, setToolbarItemWidths] = useState<Record<string, number>>({});
    const toolbarOpen = openMenu !== null || Boolean(expandedContent);
    const chromelessPanel = expandedContentView === 'editor' || expandedContentView === 'panel';
    const settingsSelected = Boolean(expandedContent) && expandedContentView === 'editor';

    useEffect(() => {
        setPaletteTheme(activeTheme);
    }, [activeTheme]);

    const toggleMenu = (menu: Exclude<ToolbarMenu, null>) => (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu((current) => (current === menu ? null : menu));
    };

    const updateQuickStyle = (patch: Partial<HtmlConstructorQuickStyle>) => {
        onQuickStyleChange(getNextQuickStyle(quickStyle, patch));
        setOpenMenu(null);
        setMoreOpen(false);
    };

    // Color swatches keep the menu open so the author can set the other theme via
    // the light/dark toggle without reopening the palette.
    const setThemedQuickStyle = (key: 'background' | 'textColor', color: string | undefined) => {
        onQuickStyleChange(
            getNextQuickStyle(quickStyle, {
                [key]: setThemedColor(quickStyle?.[key], paletteTheme, color),
            }),
        );
    };

    const renderPaletteThemeToggle = () => (
        <div className={b('floating-theme-toggle', [stop])} role="tablist">
            {(['light', 'dark'] as const).map((theme) => (
                <button
                    key={theme}
                    type="button"
                    role="tab"
                    aria-selected={paletteTheme === theme}
                    className={b('floating-theme-tab', {active: paletteTheme === theme}, [stop])}
                    onClick={() => setPaletteTheme(theme)}
                >
                    {i18n(theme === 'light' ? 'theme_light' : 'theme_dark')}
                </button>
            ))}
        </div>
    );

    const handleOpenSettings = () => {
        setOpenMenu(null);
        setMoreOpen(false);
        onOpenSettings();
    };

    const handleDuplicate = () => {
        setOpenMenu(null);
        setMoreOpen(false);
        onDuplicate?.();
    };

    const handleRemove = () => {
        setOpenMenu(null);
        setMoreOpen(false);
        onRemove?.();
    };

    const closeMenuOnPopupClose = (open: boolean) => {
        if (!open) setOpenMenu(null);
    };

    const closeMoreOnPopupClose = (open: boolean) => {
        setMoreOpen(open);
        if (!open) setOpenMenu(null);
    };

    const closeExpandedContent = useCallback(() => {
        setOpenMenu(null);
        setMoreOpen(false);
        onCloseExpandedContent?.();
    }, [onCloseExpandedContent]);

    const renderRawButton = () => {
        if (!enabled.hasRaw) return null;
        if (styleDisabled) return renderDisabledButton(codeLabel, Code);

        return (
            <Button
                view="flat"
                size="s"
                className={stop}
                selected={settingsSelected}
                onClick={handleOpenSettings}
                aria-label={codeLabel}
            >
                <Icon data={Code} size={14} className={stop} />
            </Button>
        );
    };

    const renderDisabledButton = (label: string, icon: typeof SquareDashedText) => (
        <Button view="flat" size="s" className={stop} disabled aria-label={label} title={label}>
            <Icon data={icon} size={14} className={stop} />
        </Button>
    );

    const renderPaletteButton = () =>
        renderDisabledButton(i18n('select_palette'), SquareDashedText);

    const renderBackgroundControl = () => {
        if (!enabled.hasBackground) return null;
        if (styleDisabled) return renderDisabledButton(i18n('background_color'), BucketPaint);

        const activeColor = quickStyle?.background?.[activeTheme];
        const selectedColor = quickStyle?.background?.[paletteTheme];

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    ref={setBackgroundAnchor}
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('background')}
                    aria-label={i18n('background_color')}
                    title={i18n('background_color')}
                >
                    <span className={b('floating-control-inner', [stop])}>
                        {activeColor ? (
                            <span
                                className={b('floating-color-dot', [stop])}
                                style={{background: activeColor}}
                            />
                        ) : (
                            <Icon data={BucketPaint} size={14} className={stop} />
                        )}
                        <Icon data={ChevronDown} size={12} className={stop} />
                    </span>
                </Button>
                <Popup
                    anchorElement={backgroundAnchor}
                    open={openMenu === 'background'}
                    onOpenChange={closeMenuOnPopupClose}
                    placement="bottom-start"
                >
                    <div className={b('floating-menu', {colors: true}, [stop])}>
                        {renderPaletteThemeToggle()}
                        <div className={b('floating-swatches', [stop])}>
                            {HTML_CONSTRUCTOR_BACKGROUND_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={b(
                                        'floating-swatch',
                                        {active: selectedColor === color},
                                        [stop],
                                    )}
                                    style={{background: color}}
                                    title={getColorName(color)}
                                    onClick={() => setThemedQuickStyle('background', color)}
                                />
                            ))}
                        </div>
                        <Button
                            view="normal"
                            width="max"
                            className={b('floating-menu-reset', [stop])}
                            onClick={() => setThemedQuickStyle('background', undefined)}
                        >
                            {i18n('reset')}
                        </Button>
                    </div>
                </Popup>
            </div>
        );
    };

    const renderTextColorControl = () => {
        if (!enabled.hasTextColor) return null;
        if (styleDisabled) return renderDisabledButton(i18n('text_color'), Font);

        const activeColor = quickStyle?.textColor?.[activeTheme];
        const selectedColor = quickStyle?.textColor?.[paletteTheme] ?? '';

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    ref={setTextColorAnchor}
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('textColor')}
                    aria-label={i18n('text_color')}
                    title={i18n('text_color')}
                >
                    <span className={b('floating-control-inner', [stop])}>
                        <span
                            className={b('floating-text-color', [stop])}
                            style={
                                {
                                    '--g-md-hc-text-color': activeColor,
                                } as CSSProperties
                            }
                        >
                            <Icon data={Font} size={14} />
                        </span>
                        <Icon data={ChevronDown} size={12} className={stop} />
                    </span>
                </Button>
                <Popup
                    anchorElement={textColorAnchor}
                    open={openMenu === 'textColor'}
                    onOpenChange={closeMenuOnPopupClose}
                    placement="bottom-start"
                >
                    <div className={b('floating-menu', {text: true}, [stop])}>
                        {renderPaletteThemeToggle()}
                        <div className={b('floating-text-swatches', [stop])}>
                            {HTML_CONSTRUCTOR_TEXT_COLORS.map((color) => (
                                <button
                                    key={color || 'auto'}
                                    type="button"
                                    className={b(
                                        'floating-text-swatch',
                                        {
                                            active: selectedColor === color,
                                            auto: !color,
                                            light: color.toLowerCase() === '#ffffff',
                                        },
                                        [stop],
                                    )}
                                    style={color ? {color} : undefined}
                                    title={color ? getColorName(color) : i18n('auto')}
                                    onClick={() =>
                                        setThemedQuickStyle('textColor', color || undefined)
                                    }
                                >
                                    A
                                </button>
                            ))}
                        </div>
                    </div>
                </Popup>
            </div>
        );
    };

    const renderBorderControl = () => {
        if (!enabled.hasBorder && !enabled.hasRound) return null;
        if (styleDisabled) {
            return (
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    disabled
                    aria-label={i18n('border')}
                    title={i18n('border')}
                >
                    <span className={b('floating-border-preview', [stop])} />
                </Button>
            );
        }

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    ref={setBorderAnchor}
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('border')}
                    aria-label={i18n('border')}
                    title={i18n('border')}
                >
                    <span className={b('floating-control-inner', [stop])}>
                        <span
                            className={b(
                                'floating-border-preview',
                                {none: quickStyle?.borderStyle === 'none'},
                                [stop],
                            )}
                            style={{
                                borderStyle:
                                    quickStyle?.borderStyle && quickStyle.borderStyle !== 'none'
                                        ? quickStyle.borderStyle
                                        : 'solid',
                            }}
                        />
                        <Icon data={ChevronDown} size={12} className={stop} />
                    </span>
                </Button>
                <Popup
                    anchorElement={borderAnchor}
                    open={openMenu === 'border'}
                    onOpenChange={closeMenuOnPopupClose}
                    placement="bottom-start"
                >
                    <div className={b('floating-menu', [stop])}>
                        {enabled.hasBorder && (
                            <div className={b('floating-menu-section', [stop])}>
                                <div className={b('floating-menu-section-title', [stop])}>
                                    {i18n('border')}
                                </div>
                                <button
                                    type="button"
                                    className={b('floating-menu-button', {
                                        active: !quickStyle?.borderStyle,
                                    })}
                                    onClick={() => updateQuickStyle({borderStyle: undefined})}
                                >
                                    {i18n('border_default')}
                                </button>
                                {HTML_CONSTRUCTOR_BORDER_STYLES.map((borderStyle) => (
                                    <button
                                        key={borderStyle}
                                        type="button"
                                        className={b('floating-menu-button', {
                                            active: quickStyle?.borderStyle === borderStyle,
                                        })}
                                        onClick={() => updateQuickStyle({borderStyle})}
                                    >
                                        {getBorderLabel(borderStyle)}
                                    </button>
                                ))}
                            </div>
                        )}
                        {enabled.hasRound && (
                            <div className={b('floating-menu-section', [stop])}>
                                <div className={b('floating-menu-section-title', [stop])}>
                                    {i18n('rounding')}
                                </div>
                                {HTML_CONSTRUCTOR_BORDER_RADIUS.map((radius) => (
                                    <button
                                        key={radius || 'default'}
                                        type="button"
                                        className={b('floating-menu-button', {
                                            active: (quickStyle?.borderRadius ?? '') === radius,
                                        })}
                                        onClick={() =>
                                            updateQuickStyle({borderRadius: radius || undefined})
                                        }
                                    >
                                        {getRadiusLabel(radius)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Popup>
            </div>
        );
    };

    const renderDuplicateButton = () => {
        if (!onDuplicate || !duplicateLabel) return null;

        return (
            <Button
                view="flat"
                size="s"
                className={stop}
                onClick={handleDuplicate}
                aria-label={duplicateLabel}
                title={duplicateLabel}
            >
                <Icon data={Copy} size={14} className={stop} />
            </Button>
        );
    };

    const renderDeleteButton = () => {
        if (!enabled.hasDelete || !onRemove) return null;

        return (
            <Button
                view="flat-danger"
                size="s"
                className={stop}
                onClick={handleRemove}
                aria-label={removeLabel}
                title={removeLabel}
            >
                <Icon data={TrashBin} size={14} className={stop} />
            </Button>
        );
    };

    const renderLockButton = () => {
        if (!lockLabel) return null;

        return (
            <Button
                view="flat"
                size="s"
                className={stop}
                disabled
                aria-label={lockLabel}
                title={lockLabel}
            >
                <Icon data={Lock} size={14} className={stop} />
            </Button>
        );
    };

    const toolbarActions = [
        ...primaryActions.map((action) => ({
            id: action.id,
            group: 'primary' as const,
            node: action.node,
        })),
        enabled.hasRaw &&
            !hideRawButton && {
                id: 'raw' as const,
                group: 'primary' as const,
                node: renderRawButton(),
            },
        enabled.hasBackground && {
            id: 'background' as const,
            group: 'style' as const,
            node: renderBackgroundControl(),
        },
        enabled.hasTextColor && {
            id: 'textColor' as const,
            group: 'style' as const,
            node: renderTextColorControl(),
        },
        {
            id: 'palette' as const,
            group: 'style' as const,
            node: renderPaletteButton(),
        },
        (enabled.hasBorder || enabled.hasRound) && {
            id: 'border' as const,
            group: 'style' as const,
            node: renderBorderControl(),
        },
        onDuplicate &&
            duplicateLabel && {
                id: 'duplicate' as const,
                group: 'actions' as const,
                node: renderDuplicateButton(),
            },
        enabled.hasDelete &&
            onRemove && {
                id: 'delete' as const,
                group: 'actions' as const,
                node: renderDeleteButton(),
            },
        lockLabel && {
            id: 'lock' as const,
            group: 'actions' as const,
            node: renderLockButton(),
        },
    ].filter(Boolean) as ToolbarAction[];
    const toolbarActionIds = toolbarActions.map((action) => action.id);
    const toolbarActionIdsKey = toolbarActionIds.join('|');
    const measuredActions = toolbarActionIds.every((id) => toolbarItemWidths[id]);
    const hideActionOrder = [
        ...HIDE_ACTION_ORDER,
        ...toolbarActionIds.filter((id) => !HIDE_ACTION_ORDER.includes(id)).reverse(),
    ];
    const hiddenActionIds = (() => {
        if (!measuredActions) return [];

        let visibleActions = [...toolbarActions];

        if (getToolbarWidth(visibleActions, toolbarItemWidths) <= availableToolbarWidth) return [];

        const availableWidth = availableToolbarWidth - MORE_BUTTON_FALLBACK_WIDTH;

        for (const actionId of hideActionOrder) {
            if (!visibleActions.some((action) => action.id === actionId)) continue;

            visibleActions = visibleActions.filter((action) => action.id !== actionId);

            const nextWidth = getToolbarWidth(visibleActions, toolbarItemWidths);

            if (nextWidth <= availableWidth) break;
        }

        return toolbarActionIds.filter((id) => !visibleActions.some((action) => action.id === id));
    })();
    const hiddenActionIdSet = new Set(hiddenActionIds);
    const visibleActions = toolbarActions.filter((action) => !hiddenActionIdSet.has(action.id));
    const hiddenActions = toolbarActions.filter((action) => hiddenActionIdSet.has(action.id));
    const visibleActionGroups = groupToolbarActions(visibleActions);
    const hiddenActionGroups = groupToolbarActions(hiddenActions);

    useLayoutEffect(() => {
        const updateToolbarSizes = () => {
            const toolbarRow = toolbarRowRef.current;
            if (!toolbarRow) return;

            setToolbarItemWidths((currentWidths) => {
                const nextWidths = {...currentWidths};
                let hasChanges = false;

                toolbarRow
                    .querySelectorAll<HTMLElement>('[data-toolbar-action-id]')
                    .forEach((item) => {
                        const id = item.dataset.toolbarActionId;
                        if (!id || currentWidths[id] === item.offsetWidth) return;

                        nextWidths[id] = item.offsetWidth;
                        hasChanges = true;
                    });

                return hasChanges ? nextWidths : currentWidths;
            });

            const viewportWidth =
                Math.floor(window.innerWidth * TOOLBAR_MAX_WIDTH_RATIO) -
                TOOLBAR_HORIZONTAL_PADDING;
            // Corner-anchored block toolbars must stay within their block, so cap
            // the budget to the positioned parent's width and let the rest collapse
            // into the overflow menu.
            const parent = toolbarRef.current?.offsetParent as HTMLElement | null;
            const parentWidth =
                constrainToParent && parent
                    ? parent.clientWidth - TOOLBAR_HORIZONTAL_PADDING
                    : Number.POSITIVE_INFINITY;
            const nextAvailableWidth = Math.min(viewportWidth, parentWidth);
            setAvailableToolbarWidth((currentWidth) => {
                if (currentWidth === nextAvailableWidth) return currentWidth;

                return nextAvailableWidth;
            });
        };

        updateToolbarSizes();
        window.addEventListener('resize', updateToolbarSizes);

        return () => window.removeEventListener('resize', updateToolbarSizes);
    }, [toolbarActionIdsKey, constrainToParent]);

    useEffect(() => {
        if (!expandedContent || !onCloseExpandedContent) return undefined;

        const closeOnOutsidePointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            if (toolbarRef.current?.contains(target)) return;
            // Popups (theme picker, color menus, …) render in a portal outside the
            // toolbar, but they still belong to the constructor and carry the stop
            // class. Treat them as inside so a click there is not swallowed by the
            // close handler before it reaches the element's own onClick.
            if (target.closest(`.${stop}`)) return;

            closeExpandedContent();
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeExpandedContent();
        };

        document.addEventListener('pointerdown', closeOnOutsidePointerDown, true);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePointerDown, true);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [closeExpandedContent, expandedContent, onCloseExpandedContent]);

    return (
        <div
            ref={toolbarRef}
            className={b(
                'floating-toolbar',
                {
                    open: toolbarOpen,
                    expanded: Boolean(expandedContent),
                    editor: chromelessPanel,
                },
                [stop],
            )}
        >
            <div ref={toolbarRowRef} className={b('floating-toolbar-row', [stop])}>
                {visibleActionGroups.map(({group, actions}) => (
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
                {hiddenActions.length > 0 && (
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
                                onOpenChange={closeMoreOnPopupClose}
                                placement="bottom-end"
                            >
                                <div className={b('floating-menu', {overflow: true}, [stop])}>
                                    {hiddenActionGroups.map(({group, actions}) => (
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
                <div className={b('floating-toolbar-panel', {editor: chromelessPanel}, [stop])}>
                    {expandedContent}
                </div>
            )}
            <div className={b('floating-toolbar-tail', [stop])} />
        </div>
    );
};
