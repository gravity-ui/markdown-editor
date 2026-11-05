import {Provider} from '@gravity-ui/uikit';
import type {Decorator} from '@storybook/react';

import '@gravity-ui/uikit/styles/styles.scss';
import '@gravity-ui/markdown-editor/styles/markdown.css'; // eslint-disable-line import/order

export const withThemeProvider: Decorator = (StoryItem, context) => {
    return (
        <Provider theme={context.globals.theme}>
            <StoryItem {...context} />
        </Provider>
    );
};
