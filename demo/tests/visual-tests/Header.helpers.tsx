import {composeStories} from '@storybook/react';

import * as DefaultHeaderStories from '../../src/stories/examples/header/Header.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultHeaderStories>>;

export const HeaderStories: Stories = composeStories(DefaultHeaderStories);
