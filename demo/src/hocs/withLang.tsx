import {configure as configureYfmEditor} from '@gravity-ui/markdown-editor';
import {configure} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react';

import '@gravity-ui/uikit/styles/styles.scss';

export const withLang: Decorator = (StoryItem, context) => {
    const lang = context.globals.lang;
    configure({lang});
    configureYfmEditor({lang});

    return <StoryItem {...context} />;
};
