import {
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
} from '@gravity-ui/icons';
import {Divider, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';

import {AlignmentSelect} from './AlignmentSelect';
import {type BackgroundControls, BackgroundField} from './BackgroundField';
import {SettingsSection} from './SettingsSection';
import {SettingsSwitch} from './SettingsSwitch';

export function SettingsFields({background}: {background: BackgroundControls}) {
    return (
        <>
            <Divider />
            <SettingsSection title={i18n('text')} action="Text">
                <SettingsSwitch label={i18n('heading')} action="Title" defaultChecked />
                <SettingsSwitch label={i18n('description')} action="Description" defaultChecked />
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
                <SettingsSwitch label={i18n('button-1')} action="Button 1" defaultChecked />
                <SettingsSwitch label={i18n('button-2')} action="Button 2" />
                <SettingsSwitch label={i18n('button-3')} action="Button 3" />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('image-and-background')} action="Image and background">
                <SettingsSwitch label={i18n('image')} action="Image" defaultChecked />
                <BackgroundField background={background} />
            </SettingsSection>
        </>
    );
}
