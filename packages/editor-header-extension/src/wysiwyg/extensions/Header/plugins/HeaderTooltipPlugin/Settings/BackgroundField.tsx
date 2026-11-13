import {useRef, useState} from 'react';

import {SquareMinus, Xmark} from '@gravity-ui/icons';
import {type HeaderBackground, headerBackgroundDefaults} from '@gravity-ui/markdown-plugin-header';
import {Button, Checkbox, Icon, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import type {HeaderImageLimits} from '../../HeaderUploadPlugin';

import {BackgroundPopup} from './BackgroundPopup';
import {cnHeaderSettings} from './HeaderSettings.classname';
import {bgColorLabel, bgColorStyle, imageName} from './utils';

export type BackgroundControls = HeaderImageLimits & {
    value: HeaderBackground;
    onChange: (value: Partial<HeaderBackground>) => void;
    /** Without it, the image is set by a link only. Resolves to `false` when the banner no longer takes the result. */
    upload?: (file: File) => Promise<boolean>;
};

function BackgroundPreview({value}: {value: HeaderBackground}) {
    const {'bg-image': image, 'bg-color': color} = value;
    if (image) return <img className={cnHeaderSettings('preview')} src={image} alt="" />;
    if (color) return <span className={cnHeaderSettings('preview')} style={bgColorStyle(color)} />;
    return <Icon data={SquareMinus} size={16} />;
}

export function BackgroundField({background}: {background: BackgroundControls}) {
    const {value, onChange} = background;
    const {'bg-image': image, 'bg-color': color} = value;
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const labelId = useUniqId();
    const valueId = useUniqId();
    const clearable = Boolean(image || color);
    return (
        <div className={cnHeaderSettings('row')}>
            <Text variant="body-1" id={labelId}>
                {i18n('background')}
            </Text>
            <div className={cnHeaderSettings('background')}>
                <div className={cnHeaderSettings('background-field', {clearable})}>
                    <Button
                        ref={buttonRef}
                        className={cnHeaderSettings('background-button')}
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
                            className={cnHeaderSettings('background-clear')}
                            view="flat-secondary"
                            size="s"
                            aria-label={i18n('background-remove')}
                            onClick={() => onChange(headerBackgroundDefaults)}
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
        </div>
    );
}
