import {composeStories} from '@storybook/react';

import * as DefaultPlaygroundStories from '../../../demo/stories/playground/Playground.stories';

const PlaygroundStories = composeStories(DefaultPlaygroundStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});

export const Playground = PlaygroundStories.Story;
