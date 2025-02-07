import React from 'react';

import {cn} from '../../../classname';
import {i18n} from '../../../i18n/action-previews';

import {ActionPreview} from './ActionPreview';

import './ActionPreview.scss';

const b = cn('action-preview');

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const DynamicHeading = ({level, children}: {level: HeadingLevel; children: React.ReactNode}) => {
    const HeadingTag = `h${level}`; // e.g. 'h1', 'h2', etc.

    return React.createElement(HeadingTag, {className: b('heading', {level})}, children);
};

export const HeadingPreview = ({level}: {level: HeadingLevel}) => {
    return (
        <ActionPreview>
            <DynamicHeading level={level}>{i18n('heading')}</DynamicHeading>
            <p className={b('text-with-head')}>{i18n('text-with-head')}</p>
        </ActionPreview>
    );
};
