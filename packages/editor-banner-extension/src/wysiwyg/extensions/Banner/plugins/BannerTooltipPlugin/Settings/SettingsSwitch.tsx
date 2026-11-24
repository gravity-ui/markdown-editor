import {useState} from 'react';

import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {cnBannerSettings} from './BannerSettings.classname';
import {logClick} from './utils';

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
        <div className={cnBannerSettings('row')}>
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
