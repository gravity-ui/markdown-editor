import React from 'react';

import {i18n} from '../../../i18n/action-previews';

import {ActionPreview} from './ActionPreview';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const DynamicHeading = ({level, children}: {level: HeadingLevel; children: React.ReactNode}) => {
    const HeadingTag = `h${level}`; // e.g. 'h1', 'h2', etc.

    return React.createElement(HeadingTag, {}, children);
};

export const HeadingPreview = ({level}: {level: HeadingLevel}) => {
    return (
        <ActionPreview>
            <DynamicHeading level={level}>{i18n('heading')}</DynamicHeading>
            <p>{i18n('text-with-head')}</p>
        </ActionPreview>
    );
};
