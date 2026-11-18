import {type KeyboardEvent, useRef, useState} from 'react';

import {Moon, Sun} from '@gravity-ui/icons';
import {
    type HeaderBackground,
    type HeaderBgImageTheme,
    headerAttrs,
    headerBackgroundDefaults,
    headerBgColors,
    toCssUrl,
} from '@gravity-ui/markdown-plugin-header';
import {
    Button,
    Icon,
    SegmentedRadioGroup,
    Tab,
    TabList,
    TabPanel,
    TabProvider,
    Text,
    type ThemeType,
    useThemeType,
} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsDialog, SettingsRow, cnHeaderSettings} from '../../../../settings';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {ImageSource} from './ImageSource';
import {bgColorLabel, bgColorStyle} from './utils';

const textColors: readonly HeaderBgImageTheme[] = ['system', 'dark', 'light'];
// Light text is the content in the dark theme.
const textColorKeys = {
    system: 'text-color-system',
    dark: 'text-color-light',
    light: 'text-color-dark',
} as const;

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
    End: () => headerBgColors.length - 1,
};

const mirroredKeys: Record<string, string> = {ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft'};

function FillPalette({value, onChange}: BackgroundControls) {
    const swatches = useRef<(HTMLButtonElement | null)[]>([]);
    const [active, setActive] = useState<number>();
    const selected = headerBgColors.findIndex((color) => color === value['bg-color']);
    const tabStop = active ?? Math.max(selected, 0);
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const step = paletteSteps[(rtl && mirroredKeys[event.key]) || event.key];
        if (!step) return;
        event.preventDefault();
        const next = step(tabStop);
        if (next >= 0 && next < headerBgColors.length) swatches.current[next]?.focus();
    };
    return (
        <div
            className={cnHeaderSettings('palette')}
            role="radiogroup"
            aria-label={i18n('background-fill')}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActive(undefined);
            }}
        >
            {headerBgColors.map((color, index) => {
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
                        className={cnHeaderSettings('swatch', {selected: checked})}
                        style={bgColorStyle(color)}
                        title={label}
                        aria-label={label}
                        aria-checked={checked}
                        tabIndex={index === tabStop ? 0 : -1}
                        onFocus={() => setActive(index)}
                        onKeyDown={onKeyDown}
                        onClick={() => onChange({...headerBackgroundDefaults, 'bg-color': color})}
                    />
                );
            })}
        </div>
    );
}

/** The banner with the current background, scaled down, in the chosen page theme. */
function BannerPreview({value}: {value: HeaderBackground}) {
    const pageTheme = useThemeType();
    const [theme, setTheme] = useState<ThemeType>(pageTheme);
    const image = value['bg-image'] && toCssUrl(value['bg-image']);
    return (
        <div className={cnHeaderSettings('banner-preview')}>
            <SettingsRow label={i18n('preview')}>
                {(labelId) => (
                    <SegmentedRadioGroup
                        className={cnHeaderSettings('preview-theme')}
                        size="m"
                        aria-labelledby={labelId}
                        value={theme}
                        onUpdate={setTheme}
                    >
                        {previewThemes.map(({value: option, icon, label}) => (
                            <SegmentedRadioGroup.Option
                                key={option}
                                value={option}
                                title={i18n(label)}
                                controlProps={{'aria-label': i18n(label)}}
                            >
                                <Icon data={icon} size={16} />
                            </SegmentedRadioGroup.Option>
                        ))}
                    </SegmentedRadioGroup>
                )}
            </SettingsRow>
            <div
                className={cnHeaderSettings('thumbnail', ['g-root', `g-root_theme_${theme}`])}
                aria-hidden
            >
                <div
                    className={`${headerAttrs(value).class} ${cnHeaderSettings('banner')}`}
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
        </div>
    );
}

function ImageTab({background, onClose}: {background: BackgroundControls; onClose: () => void}) {
    const {value, onChange, upload, cancelUpload} = background;
    return (
        <ImageSource
            image={value['bg-image']}
            limits={background}
            upload={upload}
            cancelUpload={cancelUpload}
            onLink={(address) => onChange({'bg-image': address})}
            onClose={onClose}
        >
            {(file) => (
                <>
                    <BannerPreview value={value} />
                    {file}
                    <DimensionSelect
                        label={i18n('text-color')}
                        value={value['bg-image-theme']}
                        values={textColors}
                        format={(theme) => i18n(textColorKeys[theme])}
                        onUpdate={(theme) => onChange({'bg-image-theme': theme})}
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
    const activeTab = useRef<HTMLButtonElement>(null);
    return (
        <SettingsDialog
            title={i18n('background')}
            className={cnHeaderSettings('popup')}
            popupClassName={cnHeaderSettings('background-surface')}
            qa="header-background"
            closeSize="m"
            closeAnchor={anchor}
            onClose={onClose}
            anchorElement={anchor}
            placement={['top-end', 'bottom-end']}
            initialFocus={activeTab}
        >
            <TabProvider value={tab} onUpdate={setTab}>
                <div className={cnHeaderSettings('tabs')}>
                    <TabList size="m">
                        <Tab value="fill" ref={tab === 'fill' ? activeTab : undefined}>
                            {i18n('background-fill')}
                        </Tab>
                        <Tab value="image" ref={tab === 'image' ? activeTab : undefined}>
                            {i18n('image')}
                        </Tab>
                    </TabList>
                    <Button view="flat" size="m" onClick={() => onChange(headerBackgroundDefaults)}>
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
