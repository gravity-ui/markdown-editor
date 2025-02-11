import {cn} from '../../../classname';

import './ActionPreview.scss';

const b = cn('action-preview');

export const ActionPreview = ({children}: {children: React.ReactNode}) => {
    return <div className={b(null, ['yfm'])}>{children}</div>;
};
