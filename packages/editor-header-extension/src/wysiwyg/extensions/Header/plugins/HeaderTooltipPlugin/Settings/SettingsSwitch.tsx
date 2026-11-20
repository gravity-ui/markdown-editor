import {useState} from 'react';

import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {cnHeaderSettings} from './HeaderSettings.classname';
import {logClick} from './utils';

export function SettingsSwitch({
    label,
    action,
    defaultChecked = false,
    checked: value,
    onUpdate,
}: {
    label: string;
    action: string;
    defaultChecked?: boolean;
    /** With `checked`, the switch shows the value and reports changes to `onUpdate`. */
    checked?: boolean;
    onUpdate?: (checked: boolean) => void;
}) {
    const [state, setState] = useState(defaultChecked);
    const checked = value ?? state;
    const controlId = useUniqId();
    return (
        <div className={cnHeaderSettings('row')}>
            <Text as="label" variant="body-1" htmlFor={controlId}>
                {label}
            </Text>
            <Switch
                id={controlId}
                size="m"
                checked={checked}
                onUpdate={(next) => {
                    if (onUpdate) {
                        onUpdate(next);
                        return;
                    }
                    setState(next);
                    logClick(`${action} toggle`);
                }}
            />
        </div>
    );
}
