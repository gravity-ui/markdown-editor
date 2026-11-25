import {type CSSProperties, type FocusEvent, type KeyboardEvent, useRef, useState} from 'react';

import {Moon, Sun} from '@gravity-ui/icons';
import {
    type BannerBackground,
    type BannerBgColor,
    type BannerBgTheme,
    bannerBackgroundDefaults,
    bannerBgColorFamilies,
    bannerBgColors,
    bannerRender,
} from '@gravity-ui/markdown-plugin-banner';
import {
    Button,
    Tab,
    TabList,
    TabPanel,
    TabProvider,
    Text,
    type ThemeType,
    useThemeType,
} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {ImageSource, SettingsDialog, cnBannerSettings} from '../../../../../components/settings';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {SegmentedSelect} from './SegmentedSelect';
import {bgColorLabel, bgColorStyle} from './utils';

const textColors: readonly BannerBgTheme[] = ['system', 'dark', 'light'];
// Light text is the content in the dark theme.
const textColorKeys = {
    system: 'text-color-system',
    dark: 'text-color-light',
    light: 'text-color-dark',
} as const;
const formatTextColor = (theme: BannerBgTheme) => i18n(textColorKeys[theme]);

const previewThemes = [
    {value: 'light', icon: Sun, label: 'preview-light'},
    {value: 'dark', icon: Moon, label: 'preview-dark'},
] as const;

// `bannerBgColors` is a row of families for each saturation.
const PALETTE_COLUMNS = bannerBgColorFamilies.length;

const paletteStyle = {'--g-md-banner-settings-palette-columns': PALETTE_COLUMNS} as CSSProperties;

const paletteSteps: Record<string, (index: number) => number> = {
    ArrowLeft: (index) => index - 1,
    ArrowRight: (index) => index + 1,
    ArrowUp: (index) => index - PALETTE_COLUMNS,
    ArrowDown: (index) => index + PALETTE_COLUMNS,
    Home: () => 0,
    End: () => bannerBgColors.length - 1,
};

const mirroredKeys: Record<string, string> = {ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft'};

type BackgroundPopupProps = {
    anchor: HTMLElement | null;
    background: BackgroundControls;
    onClose: () => void;
};

export function BackgroundPopup({anchor, background, onClose}: BackgroundPopupProps) {
    const [tab, setTab] = useState(background.value['bg-image'] ? 'image' : 'fill');
    const activeTab = useRef<HTMLButtonElement>(null);
    const reset = () => background.onChange(bannerBackgroundDefaults);
    return (
        <SettingsDialog
            title={i18n('background')}
            className={cnBannerSettings('popup')}
            popupClassName={cnBannerSettings('background-surface')}
            qa="banner-background"
            closeSize="m"
            closeAnchor={anchor}
            onClose={onClose}
            anchorElement={anchor}
            placement={['top-end', 'bottom-end']}
            initialFocus={activeTab}
        >
            <TabProvider value={tab} onUpdate={setTab}>
                <div className={cnBannerSettings('tabs')}>
                    <TabList size="m">
                        <Tab value="fill" ref={tab === 'fill' ? activeTab : undefined}>
                            {i18n('background-fill')}
                        </Tab>
                        <Tab value="image" ref={tab === 'image' ? activeTab : undefined}>
                            {i18n('image')}
                        </Tab>
                    </TabList>
                    <Button view="flat" size="m" onClick={reset}>
                        {i18n('background-reset')}
                    </Button>
                </div>
                <TabPanel value="fill">
                    <FillPalette {...background} />
                </TabPanel>
                <TabPanel value="image">
                    <ImageTab background={background} onClose={onClose} />
                </TabPanel>
            </TabProvider>
        </SettingsDialog>
    );
}

function FillPalette({value, onChange}: BackgroundControls) {
    const swatches = useRef<(HTMLButtonElement | null)[]>([]);
    const [active, setActive] = useState<number>();
    const selected = bannerBgColors.findIndex((color) => color === value['bg-color']);
    const tabStop = active ?? Math.max(selected, 0);
    const registerSwatch = (index: number, element: HTMLButtonElement | null) => {
        swatches.current[index] = element;
    };
    const selectColor = (color: BannerBgColor) =>
        onChange({...bannerBackgroundDefaults, 'bg-color': color});
    const onBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(undefined);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const step = paletteSteps[(rtl && mirroredKeys[event.key]) || event.key];
        if (!step) return;
        event.preventDefault();
        const next = step(tabStop);
        const swatch = swatches.current[next];
        if (swatch) {
            swatch.focus();
            selectColor(bannerBgColors[next]);
        }
    };
    return (
        <div
            className={cnBannerSettings('palette')}
            style={paletteStyle}
            role="radiogroup"
            aria-label={i18n('background-fill')}
            onBlur={onBlur}
        >
            {bannerBgColors.map((color, index) => (
                <Swatch
                    key={color}
                    color={color}
                    index={index}
                    checked={index === selected}
                    focusable={index === tabStop}
                    onRef={registerSwatch}
                    onFocusIndex={setActive}
                    onSelect={selectColor}
                    onKeyDown={onKeyDown}
                />
            ))}
        </div>
    );
}

type SwatchProps = {
    color: BannerBgColor;
    index: number;
    checked: boolean;
    focusable: boolean;
    onRef: (index: number, element: HTMLButtonElement | null) => void;
    onFocusIndex: (index: number) => void;
    onSelect: (color: BannerBgColor) => void;
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

function Swatch({
    color,
    index,
    checked,
    focusable,
    onRef,
    onFocusIndex,
    onSelect,
    onKeyDown,
}: SwatchProps) {
    const label = bgColorLabel(color);
    const setRef = (element: HTMLButtonElement | null) => onRef(index, element);
    const onFocus = () => onFocusIndex(index);
    const onClick = () => onSelect(color);
    return (
        <button
            ref={setRef}
            type="button"
            role="radio"
            className={cnBannerSettings('swatch', {selected: checked})}
            style={bgColorStyle(color)}
            title={label}
            aria-label={label}
            aria-checked={checked}
            tabIndex={focusable ? 0 : -1}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            onClick={onClick}
        />
    );
}

function ImageTab({background, onClose}: {background: BackgroundControls; onClose: () => void}) {
    const {value, parser, onChange, upload} = background;
    const setImage = (address: string) => onChange({'bg-image': address});
    const setTheme = (theme: BannerBgTheme) => onChange({'bg-theme': theme});
    return (
        <ImageSource
            image={value['bg-image']}
            limits={background}
            parser={parser}
            upload={upload}
            onLink={setImage}
            onClose={onClose}
        >
            {(file) => (
                <>
                    <BannerPreview value={value} />
                    {file}
                    <DimensionSelect
                        label={i18n('text-color')}
                        value={value['bg-theme']}
                        values={textColors}
                        format={formatTextColor}
                        onUpdate={setTheme}
                    />
                </>
            )}
        </ImageSource>
    );
}

function BannerPreview({value}: {value: BannerBackground}) {
    const pageTheme = useThemeType();
    const [theme, setTheme] = useState<ThemeType>(pageTheme);
    const {className, backgroundImage} = bannerRender(value);
    const options = previewThemes.map(({label, ...option}) => ({...option, label: i18n(label)}));
    return (
        <div className={cnBannerSettings('banner-preview')}>
            <SegmentedSelect
                className={cnBannerSettings('preview-theme')}
                label={i18n('preview')}
                value={theme}
                options={options}
                onUpdate={setTheme}
            />
            <div
                className={cnBannerSettings('thumbnail', ['g-root', `g-root_theme_${theme}`])}
                aria-hidden
            >
                <div
                    className={`${className} ${cnBannerSettings('banner')}`}
                    style={{backgroundImage: backgroundImage ?? undefined}}
                >
                    <Text variant="header-1" as="div">
                        {i18n('preview-title')}
                    </Text>
                    <Text variant="body-2" as="div">
                        {i18n('preview-description')}
                    </Text>
                </div>
            </div>
        </div>
    );
}
