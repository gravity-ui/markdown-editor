import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {cnBannerSettings} from './classname';

type SettingsSwitchProps = {
    label: string;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onUpdate?: (checked: boolean) => void;
};

export function SettingsSwitch({
    label,
    checked,
    defaultChecked,
    disabled,
    onUpdate,
}: SettingsSwitchProps) {
    const controlId = useUniqId();
    return (
        <div className={cnBannerSettings('row')}>
            <Text
                as="label"
                variant="body-1"
                color={disabled ? 'hint' : undefined}
                htmlFor={controlId}
            >
                {label}
            </Text>
            <Switch
                id={controlId}
                size="m"
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                onUpdate={onUpdate}
            />
        </div>
    );
}
