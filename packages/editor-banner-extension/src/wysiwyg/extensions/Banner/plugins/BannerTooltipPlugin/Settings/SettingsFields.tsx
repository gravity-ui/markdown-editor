import {
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
    SquareMinus,
} from '@gravity-ui/icons';
import {Button, Divider, Icon, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsSwitch, cnBannerSettings} from '../../../../../components/settings';
import type {BannerPart, BannerParts} from '../../../parts';

import {AlignmentSelect} from './AlignmentSelect';
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
    if (!content.available[part]) {
        return (
            <SettingsSwitch
                label={label}
                defaultChecked
                onUpdate={() => logClick(`${action} toggle`)}
            />
        );
    }
    return (
        <SettingsSwitch
            label={label}
            checked={content.parts[part]}
            onUpdate={(enabled) => content.onPartChange(part, enabled)}
        />
    );
}

export function SettingsFields({content}: {content: ContentControls}) {
    const backgroundLabelId = useUniqId();
    const backgroundValueId = useUniqId();
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
                <AlignmentSelect
                    label={i18n('vertical-alignment')}
                    defaultValue="top"
                    options={[
                        {
                            value: 'top',
                            label: i18n('top'),
                            icon: ObjectsAlignTop,
                            action: 'Align top',
                        },
                        {
                            value: 'center',
                            label: i18n('center'),
                            icon: ObjectsAlignCenterVertical,
                            action: 'Align vertically center',
                        },
                        {
                            value: 'bottom',
                            label: i18n('bottom'),
                            icon: ObjectsAlignBottom,
                            action: 'Align bottom',
                        },
                    ]}
                />
                <AlignmentSelect
                    label={i18n('horizontal-alignment')}
                    defaultValue="center"
                    options={[
                        {
                            value: 'left',
                            label: i18n('left'),
                            icon: ObjectsAlignLeft,
                            action: 'Align left',
                        },
                        {
                            value: 'center',
                            label: i18n('center'),
                            icon: ObjectsAlignCenterHorizontal,
                            action: 'Align horizontally center',
                        },
                        {
                            value: 'right',
                            label: i18n('right'),
                            icon: ObjectsAlignRight,
                            action: 'Align right',
                        },
                    ]}
                />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('buttons')} action="Buttons">
                <SettingsSwitch
                    label={i18n('button-1')}
                    defaultChecked
                    onUpdate={() => logClick('Button 1 toggle')}
                />
                <SettingsSwitch
                    label={i18n('button-2')}
                    onUpdate={() => logClick('Button 2 toggle')}
                />
                <SettingsSwitch
                    label={i18n('button-3')}
                    onUpdate={() => logClick('Button 3 toggle')}
                />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('image-and-background')} action="Image and background">
                <PartSwitch part="image" label={i18n('image')} action="Image" content={content} />
                <div className={cnBannerSettings('row')}>
                    <Text variant="body-1" id={backgroundLabelId}>
                        {i18n('background')}
                    </Text>
                    <Button
                        className={cnBannerSettings('background')}
                        view="outlined"
                        size="m"
                        width="max"
                        aria-labelledby={`${backgroundLabelId} ${backgroundValueId}`}
                        onClick={() => logClick('Background button')}
                    >
                        <Icon data={SquareMinus} size={16} />
                        <span id={backgroundValueId}>{i18n('no-background')}</span>
                    </Button>
                </div>
            </SettingsSection>
        </>
    );
}
