import {useState} from 'react';

import {Icon, type IconData, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {SettingsRow} from '../../../../settings';

import {logClick} from './utils';

export function AlignmentSelect({
    label,
    defaultValue,
    options,
}: {
    label: string;
    defaultValue: string;
    options: {value: string; label: string; icon: IconData; action: string}[];
}) {
    const [value, setValue] = useState(defaultValue);
    return (
        <SettingsRow label={label}>
            {(labelId) => (
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
            )}
        </SettingsRow>
    );
}
