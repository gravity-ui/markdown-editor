import {useRef, useState} from 'react';

import {SquareMinus, Xmark} from '@gravity-ui/icons';
import {type BannerBackground, bannerBackgroundDefaults} from '@gravity-ui/markdown-plugin-banner';
import {Button, Checkbox, Icon, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsRow, cnBannerSettings} from '../../../../settings';
import type {BannerImageLimits} from '../../BannerUploadPlugin';

import {BackgroundPopup} from './BackgroundPopup';
import {bgColorLabel, bgColorStyle, imageName} from './utils';

export type BackgroundControls = BannerImageLimits & {
    value: BannerBackground;
    onChange: (value: Partial<BannerBackground>) => void;
    /** Without it, the image is set by a link only. Resolves to `false` when the banner no longer takes the result. */
    upload?: (file: File) => Promise<boolean>;
    cancelUpload?: () => void;
};

function BackgroundPreview({value}: {value: BannerBackground}) {
    const {'bg-image': image, 'bg-color': color} = value;
    if (image) return <img className={cnBannerSettings('preview')} src={image} alt="" />;
    if (color) return <span className={cnBannerSettings('preview')} style={bgColorStyle(color)} />;
    return <Icon data={SquareMinus} size={16} />;
}

export function BackgroundField({background}: {background: BackgroundControls}) {
    const {value, onChange} = background;
    const {'bg-image': image, 'bg-color': color} = value;
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const valueId = useUniqId();
    const clearable = Boolean(image || color);
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
                                onClick={() => setOpen(!open)}
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
                                    onClick={() => {
                                        onChange(bannerBackgroundDefaults);
                                        buttonRef.current?.focus();
                                    }}
                                >
                                    <Icon data={Xmark} size={14} />
                                </Button>
                            )}
                        </div>
                        {image && (
                            <Checkbox
                                size="l"
                                checked={value['bg-image-blur']}
                                onUpdate={(checked) => onChange({'bg-image-blur': checked})}
                            >
                                {i18n('background-blur')}
                            </Checkbox>
                        )}
                    </div>
                    {open && (
                        <BackgroundPopup
                            anchor={buttonRef.current}
                            background={background}
                            onClose={() => setOpen(false)}
                        />
                    )}
                </>
            )}
        </SettingsRow>
    );
}
