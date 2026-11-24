import type {MouseEvent} from 'react';

import {Icon, type IconData, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {SettingsRow} from '../../../../../components/settings';

type SegmentedSelectProps<T extends string> = {
    label: string;
    value: T;
    options: readonly {value: T; label: string; icon: IconData}[];
    onUpdate: (value: T) => void;
    /** Called on every click of an option, including the selected one. */
    onOptionClick?: (value: T) => void;
    className?: string;
};

/** A settings row with a segmented choice of icons; each icon is named by its label. */
export function SegmentedSelect<T extends string>({
    label,
    value,
    options,
    onUpdate,
    onOptionClick,
    className,
}: SegmentedSelectProps<T>) {
    const select = (next: string) => onUpdate(next as T);
    const handleOptionClick = (event: MouseEvent<HTMLInputElement>) =>
        onOptionClick?.(event.currentTarget.value as T);
    return (
        <SettingsRow label={label}>
            {(labelId) => (
                <SegmentedRadioGroup
                    className={className}
                    size="m"
                    aria-labelledby={labelId}
                    value={value}
                    onUpdate={select}
                >
                    {options.map((option) => (
                        <SegmentedRadioGroup.Option
                            key={option.value}
                            value={option.value}
                            title={option.label}
                            controlProps={{'aria-label': option.label, onClick: handleOptionClick}}
                        >
                            <Icon data={option.icon} size={16} />
                        </SegmentedRadioGroup.Option>
                    ))}
                </SegmentedRadioGroup>
            )}
        </SettingsRow>
    );
}
