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

import {AlignmentSelect} from './AlignmentSelect';
import {SettingsSection} from './SettingsSection';
import {logClick} from './utils';

export function SettingsFields() {
    const backgroundLabelId = useUniqId();
    const backgroundValueId = useUniqId();
    const handleTitleToggle = () => logClick('Title toggle');
    const handleDescriptionToggle = () => logClick('Description toggle');
    const handleButton1Toggle = () => logClick('Button 1 toggle');
    const handleButton2Toggle = () => logClick('Button 2 toggle');
    const handleButton3Toggle = () => logClick('Button 3 toggle');
    const handleImageToggle = () => logClick('Image toggle');
    const handleBackgroundButton = () => logClick('Background button');
    return (
        <>
            <Divider />
            <SettingsSection title={i18n('text')} action="Text">
                <SettingsSwitch
                    label={i18n('heading')}
                    defaultChecked
                    onUpdate={handleTitleToggle}
                />
                <SettingsSwitch
                    label={i18n('description')}
                    defaultChecked
                    onUpdate={handleDescriptionToggle}
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
                    onUpdate={handleButton1Toggle}
                />
                <SettingsSwitch label={i18n('button-2')} onUpdate={handleButton2Toggle} />
                <SettingsSwitch label={i18n('button-3')} onUpdate={handleButton3Toggle} />
            </SettingsSection>
            <Divider />
            <SettingsSection title={i18n('image-and-background')} action="Image and background">
                <SettingsSwitch label={i18n('image')} defaultChecked onUpdate={handleImageToggle} />
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
                        onClick={handleBackgroundButton}
                    >
                        <Icon data={SquareMinus} size={16} />
                        <span id={backgroundValueId}>{i18n('no-background')}</span>
                    </Button>
                </div>
            </SettingsSection>
        </>
    );
}
