import * as DefaultHeaderStories from '../../src/stories/header/Header.stories';

import {composeStories} from './utils/compose-stories';

export const HeaderStories = composeStories(DefaultHeaderStories, {
    uploadFile: async () => ({url: '/assets/test-image.jpg'}),
});
