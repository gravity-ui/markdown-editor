import {useState} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import {Icon, type IconData, SegmentedRadioGroup, Text, useUniqId} from '@gravity-ui/uikit';

import {logClick} from './utils';

const b = cn('header-settings');

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
