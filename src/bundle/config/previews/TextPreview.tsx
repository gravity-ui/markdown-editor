import React from 'react';

import {i18n} from '../../../i18n/action-previews';

import {ActionPreview} from './ActionPreview';

import {cn} from '../../../classname';

import './ActionPreview.scss';

const b = cn('action-preview');

export const TextPreview = () => {
    return (
        <ActionPreview>
            <p className={b('text')}>{i18n('text')}</p>
        </ActionPreview>
    );
};
