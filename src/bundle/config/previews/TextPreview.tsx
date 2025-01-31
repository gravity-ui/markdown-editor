import React from 'react';

import {i18n} from '../../../i18n/action-previews';

import {ActionPreview} from './ActionPreview';

export const TextPreview = () => {
    return (
        <ActionPreview>
            <p>{i18n('text')}</p>
        </ActionPreview>
    );
};
