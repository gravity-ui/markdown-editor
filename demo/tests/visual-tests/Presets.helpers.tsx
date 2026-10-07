import * as DefaultPresetsStories from '../../src/stories/presets/Presets.stories';

import {composeStories} from './compose-stories';

export const PresetsStories = composeStories(DefaultPresetsStories, {
    stickyToolbar: false,
    devTools: false,
});
