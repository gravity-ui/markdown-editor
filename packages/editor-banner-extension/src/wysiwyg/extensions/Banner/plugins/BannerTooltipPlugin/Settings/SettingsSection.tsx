import type {ReactNode} from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, Disclosure, Icon, Text} from '@gravity-ui/uikit';

import {cnBannerSettings} from '../../../../settings';

const ICON_SIZE = 16;

export function SettingsSection({title, children}: {title: string; children: ReactNode}) {
    return (
        <Disclosure className={cnBannerSettings('section')} defaultExpanded>
            <Disclosure.Summary>
                {({id, ariaControls, expanded, onClick}) => (
                    <div className={cnBannerSettings('title')}>
                        <Text
                            as="h3"
                            className={cnBannerSettings('heading')}
                            variant="subheader-2"
                            id={id}
                        >
                            {title}
                        </Text>
                        <Button
                            view="flat-secondary"
                            size="m"
                            aria-labelledby={id}
                            aria-expanded={expanded}
                            aria-controls={ariaControls}
                            onClick={onClick}
                        >
                            <Icon data={expanded ? ChevronUp : ChevronDown} size={ICON_SIZE} />
                        </Button>
                    </div>
                )}
            </Disclosure.Summary>
            <div className={cnBannerSettings('fields')}>{children}</div>
        </Disclosure>
    );
}
