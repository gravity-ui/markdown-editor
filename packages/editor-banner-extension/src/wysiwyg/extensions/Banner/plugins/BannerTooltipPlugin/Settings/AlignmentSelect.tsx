import {useState} from 'react';

import type {IconData} from '@gravity-ui/uikit';

import {SegmentedSelect} from './SegmentedSelect';
import {logClick} from './utils';

type AlignmentOption = {value: string; label: string; icon: IconData; action: string};

type AlignmentSelectProps = {
    label: string;
    defaultValue: string;
    options: AlignmentOption[];
};

/** The demonstration alignment: the choice stays in the panel and each click is logged. */
export function AlignmentSelect({label, defaultValue, options}: AlignmentSelectProps) {
    const [value, setValue] = useState(defaultValue);
    const logOptionClick = (clicked: string) => {
        const option = options.find((item) => item.value === clicked);
        if (option) logClick(`${option.action} button`);
    };
    return (
        <SegmentedSelect
            label={label}
            value={value}
            options={options}
            onUpdate={setValue}
            onOptionClick={logOptionClick}
        />
    );
}
