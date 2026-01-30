import {composeStories} from '@storybook/react';

import * as DefaultYFMStories from '../../src/stories/yfm/YFM.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultYFMStories>>;

export const YFMStories: Stories = composeStories(DefaultYFMStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});
