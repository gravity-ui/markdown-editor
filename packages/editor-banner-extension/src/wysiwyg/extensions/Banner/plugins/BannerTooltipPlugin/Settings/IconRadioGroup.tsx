import {Icon, type IconData, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {SettingsRow} from '../../../../settings';

const ICON_SIZE = 16;

type IconRadioGroupProps<T extends string> = {
    label: string;
    className?: string;
    value: T;
    options: readonly {value: T; label: string; icon: IconData}[];
    onUpdate: (value: T) => void;
};

export function IconRadioGroup<T extends string>({
    label,
    className,
    value,
    options,
    onUpdate,
}: IconRadioGroupProps<T>) {
    return (
        <SettingsRow label={label}>
            {(labelId) => (
                <SegmentedRadioGroup
                    className={className}
                    size="m"
                    aria-labelledby={labelId}
                    value={value}
                    onUpdate={onUpdate}
                >
                    {options.map((option) => (
                        <SegmentedRadioGroup.Option
                            key={option.value}
                            value={option.value}
                            title={option.label}
                            controlProps={{'aria-label': option.label}}
                        >
                            <Icon data={option.icon} size={ICON_SIZE} />
                        </SegmentedRadioGroup.Option>
                    ))}
                </SegmentedRadioGroup>
            )}
        </SettingsRow>
    );
}
