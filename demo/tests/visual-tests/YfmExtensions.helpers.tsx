import * as DefaultYFMStories from '../../src/stories/yfm/YFM.stories';

import {composeStories} from './compose-stories';

export const YFMStories = composeStories(DefaultYFMStories, {
    stickyToolbar: false,
    devTools: false,
});
