import {Spin} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import type {ToolbarStatus} from '../../toolbar/FlexToolbar';

import './ResourceReplacementStatus.scss';

const b = cn('resource-replacement-status');

function ResourceReplacementStatus() {
    return (
        <span className={b()} aria-hidden="true" data-qa="g-md-resource-replacement-status">
            <span className={b('icon')}>
                <Spin size="xs" className={b('spin')} />
            </span>
        </span>
    );
}

export const resourceReplacementToolbarStatus: ToolbarStatus = {
    width: 28,
    content: <ResourceReplacementStatus />,
};
