import {useRef, useState} from 'react';

import {SquareMinus, Xmark} from '@gravity-ui/icons';
import {
    type BannerBackground,
    type LinkParser,
    bannerBackgroundDefaults,
} from '@gravity-ui/markdown-plugin-banner';
import {Button, Checkbox, Icon, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {
    type BannerUploadLimits,
    SettingsRow,
    cnBannerSettings,
    imageName,
} from '../../../../../components/settings';

import {BackgroundPopup} from './BackgroundPopup';
import {bgColorLabel, bgColorStyle} from './utils';

export type BackgroundControls = BannerUploadLimits & {
    value: BannerBackground;
    parser: LinkParser;
    onChange: (value: Partial<BannerBackground>) => void;
    /** Without it, the image is set by a link only. Resolves to `false` when the banner no longer takes the result. */
    upload?: (file: File, signal: AbortSignal) => Promise<boolean>;
};

export function BackgroundField({background}: {background: BackgroundControls}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const {value, onChange} = background;
    const {'bg-image': image, 'bg-color': color} = value;
    const clearable = Boolean(image || color);
    const toggle = () => setOpen(!open);
    const close = () => setOpen(false);
    const clear = () => {
        onChange(bannerBackgroundDefaults);
        buttonRef.current?.focus();
    };
    const setBlur = (checked: boolean) => onChange({'bg-image-blur': checked});
    const valueId = useUniqId();
    return (
        <SettingsRow label={i18n('background')}>
            {(labelId) => (
                <>
                    <div className={cnBannerSettings('background')}>
                        <div className={cnBannerSettings('background-field', {clearable})}>
                            <Button
                                ref={buttonRef}
                                className={cnBannerSettings('background-button')}
                                view="outlined"
                                size="m"
                                width="max"
                                aria-labelledby={`${labelId} ${valueId}`}
                                aria-haspopup="dialog"
                                aria-expanded={open}
                                onClick={toggle}
                            >
                                <Button.Icon>
                                    <BackgroundPreview value={value} />
                                </Button.Icon>
                                <span id={valueId}>
                                    {(image && imageName(image)) ||
                                        (color && bgColorLabel(color)) ||
                                        i18n('no-background')}
                                </span>
                            </Button>
                            {clearable && (
                                <Button
                                    className={cnBannerSettings('background-clear')}
                                    view="flat-secondary"
                                    size="s"
                                    aria-label={i18n('background-remove')}
                                    onClick={clear}
                                >
                                    <Icon data={Xmark} size={14} />
                                </Button>
                            )}
                        </div>
                        {image && (
                            <Checkbox size="m" checked={value['bg-image-blur']} onUpdate={setBlur}>
                                {i18n('background-blur')}
                            </Checkbox>
                        )}
                    </div>
                    {open && (
                        <BackgroundPopup
                            anchor={buttonRef.current}
                            background={background}
                            onClose={close}
                        />
                    )}
                </>
            )}
        </SettingsRow>
    );
}

function BackgroundPreview({value}: {value: BannerBackground}) {
    const {'bg-image': image, 'bg-color': color} = value;
    if (image) return <img className={cnBannerSettings('preview')} src={image} alt="" />;
    if (color) return <span className={cnBannerSettings('preview')} style={bgColorStyle(color)} />;
    return <Icon data={SquareMinus} size={16} />;
}
