import {useRef, useState} from 'react';

import {SquareMinus, Xmark} from '@gravity-ui/icons';
import {type BannerBackground, bannerBackgroundDefaults} from '@gravity-ui/markdown-plugin-banner';
import {Button, Checkbox, Icon, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import type {BannerUploadLimits} from '../../../../../plugins/BannerUploadPlugin';
import {SettingsRow, cnBannerSettings, imageName} from '../../../../settings';

import {BackgroundPopup} from './BackgroundPopup';
import {bgColorLabel, bgColorStyle} from './utils';

export type BackgroundControls = BannerUploadLimits & {
    value: BannerBackground;
    onChange: (value: Partial<BannerBackground>) => void;
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
    const handleButtonClick = () => setOpen(!open);
    const handleClearClick = () => {
        onChange(bannerBackgroundDefaults);
        buttonRef.current?.focus();
    };
    const handleBlurUpdate = (checked: boolean) => onChange({'bg-image-blur': checked});
    const handlePopupClose = () => setOpen(false);
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
                                onClick={handleButtonClick}
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
                                    onClick={handleClearClick}
                                >
                                    <Icon data={Xmark} size={14} />
                                </Button>
                            )}
                        </div>
                        {image && (
                            <Checkbox
                                size="m"
                                checked={value['bg-image-blur']}
                                onUpdate={handleBlurUpdate}
                            >
                                {i18n('background-blur')}
                            </Checkbox>
                        )}
                    </div>
                    {open && (
                        <BackgroundPopup
                            anchor={buttonRef.current}
                            background={background}
                            onClose={handlePopupClose}
                        />
                    )}
                </>
            )}
        </SettingsRow>
    );
}
