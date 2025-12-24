import {composeStories} from '@storybook/react';

import * as DefaultPresetsStories from '../../demo/stories/presets/Presets.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultPresetsStories>>;

export const PresetsStories: Stories = composeStories(DefaultPresetsStories, {
    argsEnhancers: [
        () => ({
            stickyToolbar: false,
        }),
    ],
});
