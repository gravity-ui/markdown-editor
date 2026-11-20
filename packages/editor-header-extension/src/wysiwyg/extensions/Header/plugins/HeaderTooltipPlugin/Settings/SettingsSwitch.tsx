import {useState} from 'react';

import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {cnHeaderSettings} from './HeaderSettings.classname';
import {logClick} from './utils';

/** Without `checked`, the switch keeps its state locally. */
export function SettingsSwitch({
    label,
    action,
    defaultChecked = false,
    checked: controlled,
    onUpdate,
}: {
    label: string;
    action: string;
    defaultChecked?: boolean;
    checked?: boolean;
    onUpdate?: (checked: boolean) => void;
}) {
    const [local, setLocal] = useState(defaultChecked);
    const checked = controlled ?? local;
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
                onUpdate={(value) => {
                    if (onUpdate) {
                        onUpdate(value);
                        return;
                    }
                    setLocal(value);
                    logClick(`${action} toggle`);
                }}
            />
        </div>
    );
}
