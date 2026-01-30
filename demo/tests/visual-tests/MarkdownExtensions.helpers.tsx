import {composeStories} from '@storybook/react';

import * as DefaultMarkdownStories from '../../src/stories/markdown/Markdown.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultMarkdownStories>>;

export const MarkdownStories: Stories = composeStories(DefaultMarkdownStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});
