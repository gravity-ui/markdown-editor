import {type ReactNode, useState} from 'react';

import {
    ChevronDown,
    ChevronUp,
    ObjectsAlignBottom,
    ObjectsAlignCenterHorizontal,
    ObjectsAlignCenterVertical,
    ObjectsAlignLeft,
    ObjectsAlignRight,
    ObjectsAlignTop,
    SquareMinus,
} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {
    Button,
    Divider,
    Icon,
    type IconData,
    SegmentedRadioGroup,
    Switch,
    Text,
    useUniqId,
} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';

const b = cn('header-settings');

function logClick(name: string) {
    // eslint-disable-next-line no-console -- Settings actions are demonstration placeholders.
    console.log(`${name} clicked`);
}

function SettingsSection({
    title,
    action,
    children,
}: {
    title: string;
    action: string;
    children: ReactNode;
}) {
    const [expanded, setExpanded] = useState(true);
    const contentId = useUniqId();
    return (
        <>
            <Divider />
            <div className={b('section')}>
                <div className={b('title')}>
                    <Text variant="subheader-2">{title}</Text>
                    <Button
                        view="flat-secondary"
                        size="m"
                        aria-label={title}
                        aria-expanded={expanded}
                        aria-controls={contentId}
                        onClick={() => {
                            setExpanded(!expanded);
                            logClick(`${action} section button`);
                        }}
                    >
                        <Icon data={expanded ? ChevronUp : ChevronDown} size={16} />
                    </Button>
                </div>
                <div className={b('fields')} id={contentId} hidden={!expanded}>
                    {children}
                </div>
            </div>
        </>
    );
}

function SettingsSwitch({
    label,
    action,
    defaultChecked = false,
}: {
    label: string;
    action: string;
    defaultChecked?: boolean;
}) {
    const [checked, setChecked] = useState(defaultChecked);
    const controlId = useUniqId();
    return (
        <div className={b('row')}>
            <Text as="label" variant="body-1" htmlFor={controlId}>
                {label}
            </Text>
            <Switch
                id={controlId}
                size="m"
                checked={checked}
                onUpdate={(value) => {
                    setChecked(value);
                    logClick(`${action} toggle`);
                }}
            />
        </div>
    );
}

function AlignmentSelect({
    label,
    defaultValue,
    options,
}: {
    label: string;
    defaultValue: string;
    options: {value: string; label: string; icon: IconData; action: string}[];
}) {
    const [value, setValue] = useState(defaultValue);
    const labelId = useUniqId();
    return (
        <div className={b('row')}>
            <Text variant="body-1" id={labelId}>
                {label}
            </Text>
            <SegmentedRadioGroup
                size="m"
                aria-labelledby={labelId}
                value={value}
                onUpdate={setValue}
            >
                {options.map((option) => (
                    <SegmentedRadioGroup.Option
                        key={option.value}
                        value={option.value}
                        title={option.label}
                        controlProps={{
                            'aria-label': option.label,
                            onClick: () => logClick(`${option.action} button`),
                        }}
                    >
                        <Icon data={option.icon} size={16} />
                    </SegmentedRadioGroup.Option>
                ))}
            </SegmentedRadioGroup>
        </div>
    );
}

export function SettingsFields() {
    const backgroundLabelId = useUniqId();
    return (
        <>
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
                            icon: ObjectsAlignLeft,
                            action: 'Align top',
                        },
                        {
                            value: 'center',
                            label: i18n('center'),
                            icon: ObjectsAlignCenterHorizontal,
                            action: 'Align vertically center',
                        },
                        {
                            value: 'bottom',
                            label: i18n('bottom'),
                            icon: ObjectsAlignRight,
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
                            icon: ObjectsAlignTop,
                            action: 'Align left',
                        },
                        {
                            value: 'center',
                            label: i18n('center'),
                            icon: ObjectsAlignCenterVertical,
                            action: 'Align horizontally center',
                        },
                        {
                            value: 'right',
                            label: i18n('right'),
                            icon: ObjectsAlignBottom,
                            action: 'Align right',
                        },
                    ]}
                />
            </SettingsSection>
            <SettingsSection title={i18n('buttons')} action="Buttons">
                <SettingsSwitch label={i18n('button-1')} action="Button 1" defaultChecked />
                <SettingsSwitch label={i18n('button-2')} action="Button 2" />
                <SettingsSwitch label={i18n('button-3')} action="Button 3" />
            </SettingsSection>
            <SettingsSection title={i18n('image-and-background')} action="Image and background">
                <SettingsSwitch label={i18n('image')} action="Image" defaultChecked />
                <div className={b('row')}>
                    <Text variant="body-1" id={backgroundLabelId}>
                        {i18n('background')}
                    </Text>
                    <Button
                        className={b('background')}
                        view="outlined"
                        size="m"
                        width="max"
                        aria-labelledby={backgroundLabelId}
                        onClick={() => logClick('Background button')}
                    >
                        <Icon data={SquareMinus} size={16} />
                        {i18n('no-background')}
                    </Button>
                </div>
            </SettingsSection>
        </>
    );
}
