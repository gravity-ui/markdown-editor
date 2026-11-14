import {useState} from 'react';

import {ArrowsRotateRight, Moon, Sun, Xmark} from '@gravity-ui/icons';
import {ImageForm} from '@gravity-ui/markdown-editor';
import {
    type HeaderBackground,
    type HeaderBgImageTheme,
    headerAttrs,
    headerBackgroundDefaults,
    headerBgColors,
    safeImageUrl,
    toCssUrl,
} from '@gravity-ui/markdown-plugin-header';
import {
    Button,
    Icon,
    Popup,
    SegmentedRadioGroup,
    Tab,
    TabList,
    TabPanel,
    TabProvider,
    Text,
    type ThemeType,
    useThemeType,
    useUniqId,
} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {imageFileError} from '../../HeaderUploadPlugin';

import type {BackgroundControls} from './BackgroundField';
import {DimensionSelect} from './DimensionSelect';
import {cnHeaderSettings} from './HeaderSettings.classname';
import {bgColorLabel, bgColorStyle, imageName, toMegabytes, uploadHint} from './utils';

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

function FillPalette({value, onChange}: BackgroundControls) {
    return (
        <div className={cnHeaderSettings('palette')}>
            {headerBgColors.map((color) => {
                const label = bgColorLabel(color);
                const selected = color === value['bg-color'];
                return (
                    <button
                        key={color}
                        type="button"
                        className={cnHeaderSettings('swatch', {selected})}
                        style={bgColorStyle(color)}
                        title={label}
                        aria-label={label}
                        aria-pressed={selected}
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
    const labelId = useUniqId();
    const image = value['bg-image'] && toCssUrl(value['bg-image']);
    return (
        <>
            <div className={cnHeaderSettings('row')}>
                <Text variant="body-1" id={labelId}>
                    {i18n('preview')}
                </Text>
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
            </div>
            <div className={cnHeaderSettings('thumbnail', ['g-root', `g-root_theme_${theme}`])}>
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
        </>
    );
}

function ImageTab({background, onClose}: {background: BackgroundControls; onClose: () => void}) {
    const {value, maxImageSize, onChange, upload} = background;
    const image = value['bg-image'];
    const [replacing, setReplacing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileLabelId = useUniqId();

    if (image && !replacing) {
        return (
            <div className={cnHeaderSettings('image')}>
                <BannerPreview value={value} />
                <div className={cnHeaderSettings('row')}>
                    <Text variant="body-1" id={fileLabelId}>
                        {i18n('file')}
                    </Text>
                    <div
                        className={cnHeaderSettings('file')}
                        role="group"
                        aria-labelledby={fileLabelId}
                    >
                        <img className={cnHeaderSettings('preview')} src={image} alt="" />
                        <Text className={cnHeaderSettings('file-name')} variant="body-1" ellipsis>
                            {imageName(image)}
                        </Text>
                        <Button
                            view="flat-secondary"
                            size="s"
                            aria-label={i18n('replace-file')}
                            onClick={() => setReplacing(true)}
                        >
                            <Icon data={ArrowsRotateRight} size={14} />
                        </Button>
                    </div>
                </div>
                <DimensionSelect
                    label={i18n('text-color')}
                    value={value['bg-image-theme']}
                    values={textColors}
                    format={(theme) => i18n(textColorKeys[theme])}
                    onUpdate={(theme) => onChange({'bg-image-theme': theme})}
                />
            </div>
        );
    }

    const closeForm = () => {
        setError(null);
        setReplacing(false);
    };

    const submitLink = (url: string) => {
        const address = safeImageUrl(url);
        if (!address) {
            setError(i18n('link-error'));
            return;
        }
        closeForm();
        onChange({'bg-image': address});
    };

    const uploadFile = async (file: File, send: (file: File) => Promise<boolean>) => {
        const fileError = imageFileError(file, background);
        if (fileError) {
            setError(
                fileError === 'type'
                    ? i18n('upload-error-type')
                    : i18n('upload-error-size', {size: maxImageSize && toMegabytes(maxImageSize)}),
            );
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await send(file);
            setReplacing(false);
        } catch {
            setError(i18n('upload-error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ImageForm
                className={cnHeaderSettings('image-form')}
                loading={loading}
                uploadHint={uploadHint(background) ?? undefined}
                onAttach={upload && (([file]) => uploadFile(file, upload))}
                onSubmit={({url}) => submitLink(url)}
                onCancel={image ? closeForm : onClose}
            />
            {error && (
                <Text variant="body-1" color="danger">
                    {error}
                </Text>
            )}
        </>
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
    const titleId = useUniqId();
    return (
        <Popup
            open
            anchorElement={anchor}
            placement={['top-end', 'bottom-end']}
            initialFocus={0}
            onOpenChange={(open, event, reason) => {
                // The anchor toggles the popup on its own click.
                const onAnchor =
                    reason === 'outside-press' &&
                    event?.target instanceof Node &&
                    anchor?.contains(event.target);
                if (!open && !onAnchor) onClose();
            }}
        >
            <section
                className={cnHeaderSettings('background-popup')}
                role="dialog"
                aria-labelledby={titleId}
                data-qa="header-background"
            >
                <div className={cnHeaderSettings('title')}>
                    <Text variant="subheader-3" id={titleId}>
                        {i18n('background')}
                    </Text>
                    <Button view="flat" size="m" aria-label={i18n('close')} onClick={onClose}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                <TabProvider value={tab} onUpdate={setTab}>
                    <div className={cnHeaderSettings('tabs')}>
                        <TabList size="m">
                            <Tab value="fill">{i18n('background-fill')}</Tab>
                            <Tab value="image">{i18n('image')}</Tab>
                        </TabList>
                        <Button
                            view="flat"
                            size="m"
                            onClick={() => onChange(headerBackgroundDefaults)}
                        >
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
            </section>
        </Popup>
    );
}
