import {Icon, type IconData, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {SettingsRow} from '../../../../settings';

type AlignmentSelectProps<T extends string> = {
    label: string;
    value: T;
    options: readonly {value: T; label: string; icon: IconData}[];
    onUpdate: (value: T) => void;
};

export function AlignmentSelect<T extends string>({
    label,
    value,
    options,
    onUpdate,
}: AlignmentSelectProps<T>) {
    return (
        <SettingsRow label={label}>
            {(labelId) => (
                <SegmentedRadioGroup
                    size="m"
                    aria-labelledby={labelId}
                    value={value}
                    onUpdate={(next) => onUpdate(next as T)}
                >
                    {options.map((option) => (
                        <SegmentedRadioGroup.Option
                            key={option.value}
                            value={option.value}
                            title={option.label}
                            controlProps={{'aria-label': option.label}}
                        >
                            <Icon data={option.icon} size={16} />
                        </SegmentedRadioGroup.Option>
                    ))}
                </SegmentedRadioGroup>
            )}
        </SettingsRow>
    );
}
