import {useState} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {logClick} from './utils';

const b = cn('header-settings');

export function SettingsSwitch({
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
