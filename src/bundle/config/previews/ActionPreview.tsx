import React from 'react';

import {cn} from '../../../classname';

import './ActionPreview.scss';

const b = cn('action-preview');

export const ActionPreview = ({children}: {children: React.ReactNode}) => {
    return (
        <div className={b(null, ['yfm'])}>
            {/* Div to avoid important style https://github.com/diplodoc-platform/transform/blob/75c6cae2a6d718acd2cc09e3a087e0f8dd39da8d/src/scss/_common.scss#L31 */}
            <div />
            {children}
        </div>
    );
};
