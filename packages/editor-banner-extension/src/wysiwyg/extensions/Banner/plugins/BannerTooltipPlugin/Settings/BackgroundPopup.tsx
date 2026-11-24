import {type FocusEvent, type KeyboardEvent, type MouseEvent, useRef, useState} from 'react';

import {Moon, Sun} from '@gravity-ui/icons';
import {
    type BannerBackground,
    type BannerBgTheme,
    bannerAttrs,
    bannerBackgroundDefaults,
    bannerBgColors,
    toCssUrl,
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
import {ImageSource, SettingsDialog, cnBannerSettings} from '../../../../settings';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {IconRadioGroup} from './IconRadioGroup';
import {bgColorLabel, bgColorStyle} from './utils';

const textColors: readonly BannerBgTheme[] = ['system', 'dark', 'light'];
const textColorKeys = {
    system: 'text-color-system',
    dark: 'text-color-light',
    light: 'text-color-dark',
} as const;
const textColorLabel = (theme: BannerBgTheme) => i18n(textColorKeys[theme]);

const previewThemes = [
    {value: 'light', icon: Sun, label: 'preview-light'},
    {value: 'dark', icon: Moon, label: 'preview-dark'},
] as const;

const PALETTE_COLUMNS = 6;

const paletteSteps: Record<string, (index: number) => number> = {
    ArrowLeft: (index) => index - 1,
    ArrowRight: (index) => index + 1,
    ArrowUp: (index) => index - PALETTE_COLUMNS,
    ArrowDown: (index) => index + PALETTE_COLUMNS,
    Home: () => 0,
    End: () => bannerBgColors.length - 1,
};

const mirroredKeys: Record<string, string> = {ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft'};

function FillPalette({value, onChange}: BackgroundControls) {
    const swatches = useRef<(HTMLButtonElement | null)[]>([]);
    const [active, setActive] = useState<number>();
    const selected = bannerBgColors.findIndex((color) => color === value['bg-color']);
    const tabStop = active ?? Math.max(selected, 0);
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const step = paletteSteps[(rtl && mirroredKeys[event.key]) || event.key];
        if (!step) return;
        event.preventDefault();
        const next = step(tabStop);
        if (next >= 0 && next < bannerBgColors.length) swatches.current[next]?.focus();
    };
    const handleBlur = (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(undefined);
    };
    const handleSwatchFocus = ({currentTarget}: FocusEvent<HTMLButtonElement>) =>
        setActive(swatches.current.indexOf(currentTarget));
    const handleSwatchClick = ({currentTarget}: MouseEvent<HTMLButtonElement>) =>
        onChange({
            ...bannerBackgroundDefaults,
            'bg-color': bannerBgColors[swatches.current.indexOf(currentTarget)],
        });
    return (
        <div
            className={cnBannerSettings('palette')}
            role="radiogroup"
            aria-label={i18n('background-fill')}
            onBlur={handleBlur}
        >
            {bannerBgColors.map((color, index) => {
                const label = bgColorLabel(color);
                const checked = index === selected;
                return (
                    <button
                        key={color}
                        ref={(element) => {
                            swatches.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        className={cnBannerSettings('swatch', {selected: checked})}
                        style={bgColorStyle(color)}
                        title={label}
                        aria-label={label}
                        aria-checked={checked}
                        tabIndex={index === tabStop ? 0 : -1}
                        onFocus={handleSwatchFocus}
                        onKeyDown={handleKeyDown}
                        onClick={handleSwatchClick}
                    />
                );
            })}
        </div>
    );
}

function BannerPreview({value}: {value: BannerBackground}) {
    const pageTheme = useThemeType();
    const [theme, setTheme] = useState<ThemeType>(pageTheme);
    const image = value['bg-image'] && toCssUrl(value['bg-image']);
    return (
        <>
            <IconRadioGroup
                label={i18n('preview')}
                className={cnBannerSettings('preview-theme')}
                value={theme}
                options={previewThemes.map(({value: option, icon, label}) => ({
                    value: option,
                    icon,
                    label: i18n(label),
                }))}
                onUpdate={setTheme}
            />
            <div
                className={cnBannerSettings('thumbnail', ['g-root', `g-root_theme_${theme}`])}
                aria-hidden
            >
                <div
                    className={`${bannerAttrs(value).class} ${cnBannerSettings('banner')}`}
                    style={{backgroundImage: image ?? undefined}}
                >
                    <Text variant="header-1" as="div">
                        {i18n('preview-title')}
                    </Text>
                    <Text variant="body-2" as="div">
                        {i18n('preview-description')}
                    </Text>
                </div>
            </div>
        </>
    );
}

function ImageTab({background, onClose}: {background: BackgroundControls; onClose: () => void}) {
    const {value, onChange, upload, cancelUpload} = background;
    const handleLink = (address: string) => onChange({'bg-image': address});
    const handleThemeUpdate = (theme: BannerBgTheme) => onChange({'bg-theme': theme});
    return (
        <ImageSource
            image={value['bg-image']}
            limits={background}
            upload={upload}
            cancelUpload={cancelUpload}
            onLink={handleLink}
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
                        format={textColorLabel}
                        onUpdate={handleThemeUpdate}
                    />
                </>
            )}
        </ImageSource>
    );
}

type BackgroundPopupProps = {
    anchor: HTMLElement | null;
    background: BackgroundControls;
    onClose: () => void;
};

export function BackgroundPopup({anchor, background, onClose}: BackgroundPopupProps) {
    const {value, onChange} = background;
    const [tab, setTab] = useState(value['bg-image'] ? 'image' : 'fill');
    const activeTab = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
    const handleResetClick = () => onChange(bannerBackgroundDefaults);
    return (
        <SettingsDialog
            title={i18n('background')}
            className={cnBannerSettings('popup')}
            qa="banner-background"
            closeSize="m"
            closeAnchor={anchor}
            anchorElement={anchor}
            placement={['top-end', 'bottom-end']}
            initialFocus={activeTab}
            onClose={onClose}
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
                    <Button view="flat" size="m" onClick={handleResetClick}>
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
