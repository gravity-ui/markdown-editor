import * as DefaultPresetsStories from '../../src/stories/presets/Presets.stories';

import {composeStories} from './utils/compose-stories';

export const PresetsStories = composeStories(DefaultPresetsStories, {
    stickyToolbar: false,
    devTools: false,
});
