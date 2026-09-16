import type {CSSProperties, FC, ReactNode} from 'react';

import {BucketPaint, ChevronDown, Font} from '@gravity-ui/icons';
import {Button, Icon, Popup} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';
import {useElementState} from 'src/react-utils/hooks';

import {
    HTML_CONSTRUCTOR_BACKGROUND_COLORS,
    HTML_CONSTRUCTOR_BORDER_RADIUS,
    HTML_CONSTRUCTOR_BORDER_STYLES,
    HTML_CONSTRUCTOR_COLOR_NAME_KEYS,
    HTML_CONSTRUCTOR_TEXT_COLORS,
    setThemedColor,
} from '../../quickStyle';
import type {
    HtmlConstructorBorderStyle,
    HtmlConstructorColorTheme,
    HtmlConstructorQuickStyle,
    HtmlConstructorThemedColor,
} from '../../types';
import {cnYfmHtmlConstructor as b, STOP_EVENT_CLASSNAME as stop} from '../const';

type ControlProps = {
    disabled: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const StyleControl: FC<ControlProps & {label: string; preview: ReactNode; children: ReactNode}> = ({
    disabled,
    open,
    onOpenChange,
    label,
    preview,
    children,
}) => {
    const [anchor, setAnchor] = useElementState<HTMLButtonElement>();

    return (
        <div className={b('floating-control', [stop])}>
            <Button
                ref={setAnchor}
                view="flat"
                size="s"
                className={stop}
                disabled={disabled}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenChange(!open);
                }}
                aria-label={label}
                title={label}
                aria-expanded={open}
            >
                <span className={b('floating-control-inner', [stop])}>
                    {preview}
                    {!disabled && <Icon data={ChevronDown} size={12} className={stop} />}
                </span>
            </Button>
            <Popup
                anchorElement={anchor}
                open={open && !disabled}
                onOpenChange={onOpenChange}
                placement="bottom-start"
            >
                {children}
            </Popup>
        </div>
    );
};

const getColorName = (color: string) => {
    const key = HTML_CONSTRUCTOR_COLOR_NAME_KEYS[color.toLowerCase()];
    return key ? i18n(key) : color;
};

export const ColorControl: FC<
    ControlProps & {
        kind: 'background' | 'textColor';
        value?: HtmlConstructorThemedColor;
        activeTheme: HtmlConstructorColorTheme;
        paletteTheme: HtmlConstructorColorTheme;
        onPaletteThemeChange: (theme: HtmlConstructorColorTheme) => void;
        onChange: (value: HtmlConstructorThemedColor | undefined) => void;
    }
> = ({kind, value, activeTheme, paletteTheme, onPaletteThemeChange, onChange, ...control}) => {
    const isBackground = kind === 'background';
    const activeColor = value?.[activeTheme];
    const selectedColor = value?.[paletteTheme] ?? '';
    const colors = isBackground ? HTML_CONSTRUCTOR_BACKGROUND_COLORS : HTML_CONSTRUCTOR_TEXT_COLORS;
    const swatchClass = isBackground ? 'floating-swatch' : 'floating-text-swatch';
    // Keep the palette open when switching between light and dark colors.
    const selectColor = (color?: string) => onChange(setThemedColor(value, paletteTheme, color));

    const preview = isBackground ? (
        activeColor ? (
            <span className={b('floating-color-dot', [stop])} style={{background: activeColor}} />
        ) : (
            <Icon data={BucketPaint} size={14} className={stop} />
        )
    ) : (
        <span
            className={b('floating-text-color', [stop])}
            style={{'--g-md-hc-text-color': activeColor} as CSSProperties}
        >
            <Icon data={Font} size={14} className={stop} />
        </span>
    );

    return (
        <StyleControl
            {...control}
            label={i18n(isBackground ? 'background_color' : 'text_color')}
            preview={preview}
        >
            <div
                className={b('floating-menu', {colors: isBackground, text: !isBackground}, [stop])}
            >
                <div className={b('floating-theme-toggle', [stop])} role="group">
                    {(['light', 'dark'] as const).map((theme) => (
                        <button
                            key={theme}
                            type="button"
                            aria-pressed={paletteTheme === theme}
                            className={b('floating-theme-tab', {active: paletteTheme === theme}, [
                                stop,
                            ])}
                            onClick={() => onPaletteThemeChange(theme)}
                        >
                            {i18n(theme === 'light' ? 'theme_light' : 'theme_dark')}
                        </button>
                    ))}
                </div>
                <div
                    className={b(isBackground ? 'floating-swatches' : 'floating-text-swatches', [
                        stop,
                    ])}
                >
                    {colors.map((color) => (
                        <button
                            key={color || 'auto'}
                            type="button"
                            className={b(
                                swatchClass,
                                {
                                    active: selectedColor === color,
                                    auto: !color,
                                    light: !isBackground && color.toLowerCase() === '#ffffff',
                                },
                                [stop],
                            )}
                            style={isBackground ? {background: color} : {color: color || undefined}}
                            title={color ? getColorName(color) : i18n('auto')}
                            aria-label={color ? getColorName(color) : i18n('auto')}
                            aria-pressed={selectedColor === color}
                            onClick={() => selectColor(color || undefined)}
                        >
                            {isBackground ? null : 'A'}
                        </button>
                    ))}
                </div>
                {isBackground && (
                    <Button
                        view="normal"
                        width="max"
                        className={b('floating-menu-reset', [stop])}
                        onClick={() => selectColor()}
                    >
                        {i18n('reset')}
                    </Button>
                )}
            </div>
        </StyleControl>
    );
};

const getRadiusLabel = (value: string) => {
    if (!value) return i18n('round_default');
    if (value === '0') return i18n('round_none');
    if (value === '999px') return i18n('round_pill');
    return value;
};

const getBorderLabel = (value: HtmlConstructorBorderStyle | undefined) =>
    i18n(value ? `border_${value}` : 'border_default');

export const BorderControl: FC<
    ControlProps & {
        value?: HtmlConstructorQuickStyle;
        hasBorder: boolean;
        hasRound: boolean;
        onChange: (patch: Partial<HtmlConstructorQuickStyle>) => void;
    }
> = ({value, hasBorder, hasRound, onChange, ...control}) => (
    <StyleControl
        {...control}
        label={i18n('border')}
        preview={
            <span
                className={b('floating-border-preview', {none: value?.borderStyle === 'none'}, [
                    stop,
                ])}
                style={{
                    borderStyle:
                        value?.borderStyle === 'none' ? 'solid' : (value?.borderStyle ?? 'solid'),
                }}
            />
        }
    >
        <div className={b('floating-menu', [stop])}>
            {hasBorder && (
                <div className={b('floating-menu-section', [stop])}>
                    <div className={b('floating-menu-section-title', [stop])}>{i18n('border')}</div>
                    {[undefined, ...HTML_CONSTRUCTOR_BORDER_STYLES].map((borderStyle) => (
                        <button
                            key={borderStyle ?? 'default'}
                            type="button"
                            className={b('floating-menu-button', {
                                active: value?.borderStyle === borderStyle,
                            })}
                            onClick={() => onChange({borderStyle})}
                        >
                            {getBorderLabel(borderStyle)}
                        </button>
                    ))}
                </div>
            )}
            {hasRound && (
                <div className={b('floating-menu-section', [stop])}>
                    <div className={b('floating-menu-section-title', [stop])}>
                        {i18n('rounding')}
                    </div>
                    {HTML_CONSTRUCTOR_BORDER_RADIUS.map((radius) => (
                        <button
                            key={radius || 'default'}
                            type="button"
                            className={b('floating-menu-button', {
                                active: (value?.borderRadius ?? '') === radius,
                            })}
                            onClick={() => onChange({borderRadius: radius || undefined})}
                        >
                            {getRadiusLabel(radius)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </StyleControl>
);
