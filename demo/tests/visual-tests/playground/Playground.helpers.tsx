import {composeStories} from '@storybook/react';

import * as DefaultPlaygroundStories from '../../../src/stories/playground/Playground.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultPlaygroundStories>>;

const PlaygroundStories: Stories = composeStories(DefaultPlaygroundStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});

export const Playground: typeof PlaygroundStories.Story = PlaygroundStories.Story;
