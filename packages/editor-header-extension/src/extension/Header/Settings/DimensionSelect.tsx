import {useId} from 'react';

import {Select, Text} from '@gravity-ui/uikit';

type DimensionSelectProps<T extends string> = {
    label: string;
    value: T;
    values: readonly T[];
    format: (value: T) => string;
    onUpdate: (value: T) => void;
};

export function DimensionSelect<T extends string>({
    label,
    value,
    values,
    format,
    onUpdate,
}: DimensionSelectProps<T>) {
    const labelId = useId();
    return (
        <div className="g-md-header-settings__row">
            <Text variant="body-1" id={labelId}>
                {label}
            </Text>
            <Select
                size="m"
                width="max"
                aria-labelledby={labelId}
                value={[value]}
                options={values.map((option) => ({value: option, content: format(option)}))}
                onUpdate={([next]) => {
                    const selected = values.find((option) => option === next);
                    if (selected) onUpdate(selected);
                }}
            />
        </div>
    );
}
