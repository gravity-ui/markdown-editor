import React from 'react';

import {ArrowUpRightFromSquare as LinkIcon} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {i18n} from '../i18n/forms';

import './UrlInputRow.scss';

const b = cn('url-input-row');

export type UrlInputRowProps = {
    input: React.ReactNode;
    href: string;
};

export const UrlInputRow = React.memo<UrlInputRowProps>(function UrlInputRow({href, input}) {
    return (
        <div className={b()}>
            {input}
            <ActionTooltip title={i18n('link_open_help')}>
                <Button className={b('button')} view="flat" size="s" href={href} target="_blank">
                    <Icon data={LinkIcon} size={16} />
                </Button>
            </ActionTooltip>
        </div>
    );
});
