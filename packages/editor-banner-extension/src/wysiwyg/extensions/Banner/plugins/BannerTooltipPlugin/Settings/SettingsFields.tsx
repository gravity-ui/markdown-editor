import {
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
} from '@gravity-ui/icons';
import type {BannerLayout} from '@gravity-ui/markdown-plugin-banner';
import {Divider, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsSwitch} from '../../../../../components/settings';
import type {BannerPart, BannerParts} from '../../../parts';

import {type BackgroundControls, BackgroundField} from './BackgroundField';
import {SegmentedSelect} from './SegmentedSelect';
import {SettingsSection} from './SettingsSection';
import {logClick} from './utils';

export type ContentControls = {
    parts: BannerParts;
    /** The parts that have a node type in the editor schema. */
    available: Partial<Record<BannerPart, unknown>>;
    onPartChange: (part: BannerPart, enabled: boolean) => void;
};

type PartSwitchProps = {part: BannerPart; label: string; action: string; content: ContentControls};

function PartSwitch({part, label, action, content}: PartSwitchProps) {
    const handleDemoUpdate = () => logClick(`${action} toggle`);
    const handleUpdate = (enabled: boolean) => content.onPartChange(part, enabled);
    if (!content.available[part]) {
        return <SettingsSwitch label={label} defaultChecked onUpdate={handleDemoUpdate} />;
    }
    return <SettingsSwitch label={label} checked={content.parts[part]} onUpdate={handleUpdate} />;
}

export type LayoutControls = {
    value: BannerLayout;
    onChange: <K extends keyof BannerLayout>(name: K, value: BannerLayout[K]) => void;
};

type SettingsFieldsProps = {
    content: ContentControls;
    layout: LayoutControls;
    background: BackgroundControls;
};

export function SettingsFields({content, layout, background}: SettingsFieldsProps) {
    const handleVerticalUpdate = (value: BannerLayout['vertical']) =>
        layout.onChange('vertical', value);
    const handleAlignUpdate = (value: BannerLayout['align']) => layout.onChange('align', value);
    const handleButton1Toggle = () => logClick('Button 1 toggle');
    const handleButton2Toggle = () => logClick('Button 2 toggle');
    const handleButton3Toggle = () => logClick('Button 3 toggle');
    return (
        <>
            <Divider />
            <SettingsSection title={i18n('text')} action="Text">
                <PartSwitch part="title" label={i18n('heading')} action="Title" content={content} />
                <PartSwitch
                    part="content"
                    label={i18n('description')}
                    action="Description"
                    content={content}
                />
                <Text variant="subheader-1">{i18n('alignment')}</Text>
                <SegmentedSelect
                    label={i18n('vertical-alignment')}
                    value={layout.value.vertical}
                    options={[
                        {value: 'top', label: i18n('top'), icon: ObjectsAlignTop},
                        {value: 'center', label: i18n('center'), icon: ObjectsAlignCenterVertical},
                        {value: 'bottom', label: i18n('bottom'), icon: ObjectsAlignBottom},
                    ]}
                    onUpdate={handleVerticalUpdate}
                />
                <SegmentedSelect
                    label={i18n('horizontal-alignment')}
                    value={layout.value.align}
                    options={[
                        {value: 'left', label: i18n('left'), icon: ObjectsAlignLeft},
                        {
                            value: 'center',
                            label: i18n('center'),
                            icon: ObjectsAlignCenterHorizontal,
                        },
                        {value: 'right', label: i18n('right'), icon: ObjectsAlignRight},
                    ]}
                    onUpdate={handleAlignUpdate}
                />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('buttons')} action="Buttons">
                <SettingsSwitch
                    label={i18n('button-1')}
                    defaultChecked
                    onUpdate={handleButton1Toggle}
                />
                <SettingsSwitch label={i18n('button-2')} onUpdate={handleButton2Toggle} />
                <SettingsSwitch label={i18n('button-3')} onUpdate={handleButton3Toggle} />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('image-and-background')} action="Image and background">
                <PartSwitch part="image" label={i18n('image')} action="Image" content={content} />
                <BackgroundField background={background} />
            </SettingsSection>
        </>
    );
}
