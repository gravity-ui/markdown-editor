import {composeStories} from '@storybook/react';

import * as DefaultYFMStories from '../../src/stories/yfm/YFM.stories';
import * as ConstructorStories from '../../src/stories/yfm/YfmHtmlConstructor.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultYFMStories>>;
type ConstructorStory = ReturnType<typeof composeStories<typeof ConstructorStories>>;

export const YFMStories: Stories & ConstructorStory = {
    ...composeStories(DefaultYFMStories, {
        argsEnhancers: [
            () => ({
                stickyToolbar: false,
            }),
        ],
    }),
    ...composeStories(ConstructorStories),
};
