import * as DefaultPlaygroundStories from '../../../src/stories/playground/Playground.stories';
import {composeStories} from '../utils/compose-stories';

const PlaygroundStories = composeStories(DefaultPlaygroundStories, {
    stickyToolbar: false,
    devTools: false,
    syncMarkupToUrl: false,
});

export const Playground = PlaygroundStories.Story;
