import {useEffect, useId, useRef} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import {Select, Text} from '@gravity-ui/uikit';

const b = cn('header-settings');

type DimensionSelectProps<T extends string> = {
    label: string;
    value: T;
    values: readonly T[];
    format: (value: T) => string;
    onUpdate: (value: T) => void;
    autoFocus?: boolean;
};

export function DimensionSelect<T extends string>({
    label,
    value,
    values,
    format,
    onUpdate,
    autoFocus,
}: DimensionSelectProps<T>) {
    const labelId = useId();
    const controlRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (autoFocus) controlRef.current?.focus();
    }, [autoFocus]);
    return (
        <div className={b('row')}>
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
