import type {ReactNode} from 'react';

import {Text, useUniqId} from '@gravity-ui/uikit';

import {cnBannerSettings} from './classname';

export function SettingsRow({
    label,
    children,
}: {
    label: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useUniqId();
    return (
        <div className={cnBannerSettings('row')}>
            <Text className={cnBannerSettings('label')} variant="body-1" id={labelId}>
                {label}
            </Text>
            {children(labelId)}
        </div>
    );
}
