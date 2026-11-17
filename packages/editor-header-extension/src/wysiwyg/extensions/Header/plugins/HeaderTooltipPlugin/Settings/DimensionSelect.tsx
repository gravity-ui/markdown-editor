import type {Ref} from 'react';

import {Select, Text, useUniqId} from '@gravity-ui/uikit';

import {cnHeaderSettings} from './HeaderSettings.classname';

type DimensionSelectProps<T extends string> = {
    label: string;
    value: T;
    values: readonly T[];
    format: (value: T) => string;
    onUpdate: (value: T) => void;
    controlRef?: Ref<HTMLButtonElement>;
};

export function DimensionSelect<T extends string>({
    label,
    value,
    values,
    format,
    onUpdate,
    controlRef,
}: DimensionSelectProps<T>) {
    const labelId = useUniqId();
    return (
        <div className={cnHeaderSettings('row')}>
            <Text variant="body-1" id={labelId}>
                {label}
            </Text>
            <Select
                ref={controlRef}
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
