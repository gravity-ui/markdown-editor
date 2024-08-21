import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {ComponentMeta, Story} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';
import {parseLocation} from './location';
import {initialMdContent} from './md-content';

export default {
    title: 'Experiments / Escape config',
    component: PlaygroundComponent,
} as ComponentMeta<any>;

type PlaygroundStoryProps = Pick<PlaygroundProps, 'initialEditor'> & {
    commonEscapeRegexp: string;
    startOfLineEscapeRegexp: string;
};
export const EscapeConfig: Story<PlaygroundStoryProps> = ({
    commonEscapeRegexp,
    startOfLineEscapeRegexp,
    ...props
}) => (
    <PlaygroundComponent
        {...props}
        initial={parseLocation() || initialMdContent}
        escapeConfig={{
            commonEscape: new RegExp(commonEscapeRegexp),
            startOfLineEscape: new RegExp(startOfLineEscapeRegexp),
        }}
    />
);

EscapeConfig.args = {
    initialEditor: 'wysiwyg',
    commonEscapeRegexp: '^$',
    startOfLineEscapeRegexp: '^$',
};
