import {
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
} from '@gravity-ui/icons';
import {type BannerLayout, bannerAligns, bannerVerticals} from '@gravity-ui/markdown-plugin-banner';
import {Divider, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsSwitch, cnBannerSettings} from '../../../../../components/settings';
import type {BannerPart, BannerParts} from '../../../utils';

import {type BackgroundControls, BackgroundField} from './BackgroundField';
import {SegmentedSelect} from './SegmentedSelect';
import {SettingsSection} from './SettingsSection';

const verticalIcons = {
    top: ObjectsAlignTop,
    center: ObjectsAlignCenterVertical,
    bottom: ObjectsAlignBottom,
};

const alignIcons = {
    left: ObjectsAlignLeft,
    center: ObjectsAlignCenterHorizontal,
    right: ObjectsAlignRight,
};

const buttonLabels = ['button-1', 'button-2', 'button-3'] as const;

export type ContentControls = {
    parts: BannerParts;
    buttonsAvailable: boolean;
    onPartChange: (part: BannerPart, enabled: boolean) => void;
    onButtonChange: (index: number, enabled: boolean) => void;
};

type ButtonSwitchProps = {
    index: number;
    buttons: number;
    onButtonChange: ContentControls['onButtonChange'];
};

function ButtonSwitch({index, buttons, onButtonChange}: ButtonSwitchProps) {
    const handleUpdate = (enabled: boolean) => onButtonChange(index, enabled);
    return (
        <SettingsSwitch
            label={i18n(buttonLabels[index])}
            checked={index < buttons}
            disabled={index > buttons}
            onUpdate={handleUpdate}
        />
    );
}

type SettingsFieldsProps = {
    layout: BannerLayout;
    onLayoutChange: <K extends keyof BannerLayout>(name: K, value: BannerLayout[K]) => void;
    content: ContentControls;
    background: BackgroundControls;
};

export function SettingsFields({layout, onLayoutChange, content, background}: SettingsFieldsProps) {
    const {parts, buttonsAvailable, onPartChange, onButtonChange} = content;
    const handleTitleUpdate = (enabled: boolean) => onPartChange('title', enabled);
    const handleContentUpdate = (enabled: boolean) => onPartChange('content', enabled);
    const handleImageUpdate = (enabled: boolean) => onPartChange('image', enabled);
    const handleVerticalUpdate = (vertical: BannerLayout['vertical']) =>
        onLayoutChange('vertical', vertical);
    const handleAlignUpdate = (align: BannerLayout['align']) => onLayoutChange('align', align);
    return (
        <>
            <Divider />
            <SettingsSection title={i18n('text')}>
                <SettingsSwitch
                    label={i18n('heading')}
                    checked={parts.title}
                    onUpdate={handleTitleUpdate}
                />
                <SettingsSwitch
                    label={i18n('description')}
                    checked={parts.content}
                    onUpdate={handleContentUpdate}
                />
                <Text as="h4" className={cnBannerSettings('heading')} variant="subheader-1">
                    {i18n('alignment')}
                </Text>
                <SegmentedSelect
                    label={i18n('vertical-alignment')}
                    value={layout.vertical}
                    options={bannerVerticals.map((value) => ({
                        value,
                        label: i18n(value),
                        icon: verticalIcons[value],
                    }))}
                    onUpdate={handleVerticalUpdate}
                />
                <SegmentedSelect
                    label={i18n('horizontal-alignment')}
                    value={layout.align}
                    options={bannerAligns.map((value) => ({
                        value,
                        label: i18n(value),
                        icon: alignIcons[value],
                    }))}
                    onUpdate={handleAlignUpdate}
                />
            </SettingsSection>
            {buttonsAvailable && (
                <>
                    <Divider />
                    <SettingsSection title={i18n('buttons')}>
                        {buttonLabels.map((label, index) => (
                            <ButtonSwitch
                                key={label}
                                index={index}
                                buttons={parts.buttons}
                                onButtonChange={onButtonChange}
                            />
                        ))}
                    </SettingsSection>
                </>
            )}
            <Divider />
            <SettingsSection title={i18n('image-and-background')}>
                <SettingsSwitch
                    label={i18n('image')}
                    checked={parts.image}
                    onUpdate={handleImageUpdate}
                />
                <BackgroundField background={background} />
            </SettingsSection>
        </>
    );
}
