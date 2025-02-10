import React from 'react';

import {cn} from '../../../classname';
import {i18n} from '../../../i18n/action-previews';

import {ActionPreview} from './ActionPreview';

import './ActionPreview.scss';

const b = cn('action-preview');

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const HeadingPreview = ({level}: {level: HeadingLevel}) => {
    const Heading = `h${level}` as const;

    return (
        <ActionPreview>
            <Heading>{i18n('heading')}</Heading>
            <p className={b('text-with-head')}>{i18n('text-with-head')}</p>
        </ActionPreview>
    );
};
