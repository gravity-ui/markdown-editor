import {useState} from 'react';
import type {CSSProperties, FC, MouseEvent, ReactNode} from 'react';

import {BucketPaint, ChevronDown, Code, Font, TrashBin} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {
    HTML_CONSTRUCTOR_BACKGROUND_COLORS,
    HTML_CONSTRUCTOR_BORDER_RADIUS,
    HTML_CONSTRUCTOR_BORDER_STYLES,
    HTML_CONSTRUCTOR_TEXT_COLORS,
} from '../quickStyle';
import {getEnabledHtmlConstructorSettings} from '../settings';
import type {
    HtmlConstructorBorderStyle,
    HtmlConstructorQuickStyle,
    HtmlConstructorTemplateSettings,
} from '../types';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

type ToolbarMenu = 'background' | 'textColor' | 'round' | 'border' | null;

type FloatingToolbarProps = {
    settings?: HtmlConstructorTemplateSettings;
    quickStyle?: HtmlConstructorQuickStyle;
    onQuickStyleChange: (quickStyle: HtmlConstructorQuickStyle) => void;
    onOpenSettings: (anchor: HTMLElement) => void;
    onRemove?: () => void;
    leftSlot?: ReactNode;
    codeLabel: string;
    removeLabel: string;
};

const getNextQuickStyle = (
    quickStyle: HtmlConstructorQuickStyle | undefined,
    patch: Partial<HtmlConstructorQuickStyle>,
) => {
    const next = {...quickStyle, ...patch};

    for (const key of Object.keys(next) as (keyof HtmlConstructorQuickStyle)[]) {
        if (!next[key]) delete next[key];
    }

    return next;
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

export const FloatingToolbar: FC<FloatingToolbarProps> = ({
    settings,
    quickStyle,
    onQuickStyleChange,
    onOpenSettings,
    onRemove,
    leftSlot,
    codeLabel,
    removeLabel,
}) => {
    const enabled = getEnabledHtmlConstructorSettings(settings);
    const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
    const toolbarOpen = openMenu !== null;

    const toggleMenu = (menu: Exclude<ToolbarMenu, null>) => (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu((current) => (current === menu ? null : menu));
    };

    const updateQuickStyle = (patch: Partial<HtmlConstructorQuickStyle>) => {
        onQuickStyleChange(getNextQuickStyle(quickStyle, patch));
        setOpenMenu(null);
    };

    const handleOpenSettings = (event: MouseEvent<HTMLElement>) => {
        setOpenMenu(null);
        onOpenSettings(event.currentTarget);
    };

    const handleRemove = () => {
        setOpenMenu(null);
        onRemove?.();
    };

    const renderRawButton = () => {
        if (!enabled.hasRaw) return null;

        return (
            <Button
                view="flat"
                size="s"
                className={stop}
                onClick={handleOpenSettings}
                aria-label={codeLabel}
                title={i18n('show_code')}
            >
                <Icon data={Code} size={14} className={stop} />
            </Button>
        );
    };

    const renderBackgroundControl = () => {
        if (!enabled.hasBackground) return null;

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('background')}
                    aria-label={i18n('background_color')}
                    title={i18n('background_color')}
                >
                    <span
                        className={b('floating-color-dot', [stop])}
                        style={{background: quickStyle?.background ?? 'transparent'}}
                    >
                        {!quickStyle?.background && <Icon data={BucketPaint} size={14} />}
                    </span>
                    <Icon data={ChevronDown} size={12} className={stop} />
                </Button>
                {openMenu === 'background' && (
                    <div className={b('floating-menu', {colors: true}, [stop])}>
                        {HTML_CONSTRUCTOR_BACKGROUND_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={b('floating-swatch', {
                                    active: quickStyle?.background === color,
                                })}
                                style={{background: color}}
                                title={color}
                                onClick={() => updateQuickStyle({background: color})}
                            />
                        ))}
                        <button
                            type="button"
                            className={b('floating-menu-button', [stop])}
                            onClick={() => updateQuickStyle({background: undefined})}
                        >
                            {i18n('reset')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderTextColorControl = () => {
        if (!enabled.hasTextColor) return null;

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('textColor')}
                    aria-label={i18n('text_color')}
                    title={i18n('text_color')}
                >
                    <span
                        className={b('floating-text-color', [stop])}
                        style={
                            {
                                '--g-md-hc-text-color': quickStyle?.textColor,
                            } as CSSProperties
                        }
                    >
                        <Icon data={Font} size={14} />
                    </span>
                    <Icon data={ChevronDown} size={12} className={stop} />
                </Button>
                {openMenu === 'textColor' && (
                    <div className={b('floating-menu', {text: true}, [stop])}>
                        {HTML_CONSTRUCTOR_TEXT_COLORS.map((color) => (
                            <button
                                key={color || 'auto'}
                                type="button"
                                className={b('floating-text-swatch', {
                                    active: (quickStyle?.textColor ?? '') === color,
                                    auto: !color,
                                })}
                                style={color ? {color} : undefined}
                                title={color || i18n('auto')}
                                onClick={() => updateQuickStyle({textColor: color || undefined})}
                            >
                                A
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderRoundControl = () => {
        if (!enabled.hasRound) return null;

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('round')}
                    title={i18n('rounding')}
                >
                    <span className={b('floating-button-label', [stop])}>
                        {getRadiusLabel(quickStyle?.borderRadius)}
                    </span>
                    <Icon data={ChevronDown} size={12} className={stop} />
                </Button>
                {openMenu === 'round' && (
                    <div className={b('floating-menu', [stop])}>
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
        );
    };

    const renderBorderControl = () => {
        if (!enabled.hasBorder) return null;

        return (
            <div className={b('floating-control', [stop])}>
                <Button
                    view="flat"
                    size="s"
                    className={stop}
                    onClick={toggleMenu('border')}
                    title={i18n('border')}
                >
                    <span className={b('floating-button-label', [stop])}>
                        {getBorderLabel(quickStyle?.borderStyle)}
                    </span>
                    <Icon data={ChevronDown} size={12} className={stop} />
                </Button>
                {openMenu === 'border' && (
                    <div className={b('floating-menu', [stop])}>
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
            </div>
        );
    };

    const renderDeleteButton = () => {
        if (!enabled.hasDelete || !onRemove) return null;

        return (
            <>
                <span className={b('floating-toolbar-separator', [stop])} />
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
            </>
        );
    };

    return (
        <div
            className={b('floating-toolbar', {open: toolbarOpen}, [stop])}
            onMouseLeave={() => setOpenMenu(null)}
        >
            {leftSlot}
            {leftSlot && <span className={b('floating-toolbar-separator', [stop])} />}
            {renderRawButton()}
            {renderBackgroundControl()}
            {renderTextColorControl()}
            {renderRoundControl()}
            {renderBorderControl()}
            {renderDeleteButton()}
            <div className={b('floating-toolbar-tail', [stop])} />
        </div>
    );
};
