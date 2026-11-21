import {Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {cnBannerSettings} from '../../../../settings';

export function SettingsSwitch({
    label,
    checked,
    disabled,
    onUpdate,
}: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    onUpdate: (checked: boolean) => void;
}) {
    const controlId = useUniqId();
    return (
        <div className={cnBannerSettings('row')}>
            <Text
                as="label"
                variant="body-1"
                color={disabled ? 'hint' : 'primary'}
                htmlFor={controlId}
            >
                {label}
            </Text>
            <Switch
                id={controlId}
                size="m"
                checked={checked}
                disabled={disabled}
                onUpdate={onUpdate}
            />
        </div>
    );
}
