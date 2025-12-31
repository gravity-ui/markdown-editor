import {composeStories} from '@storybook/react';

import * as DefaultPresetsStories from '../../src/stories/presets/Presets.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultPresetsStories>>;

export const PresetsStories: Stories = composeStories(DefaultPresetsStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});
