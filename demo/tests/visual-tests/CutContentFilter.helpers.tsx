import {composeStories} from '@storybook/react';

import * as DefaultCutContentFilterStories from '../../src/stories/examples/cut-content-filter/CutContentFilter.stories';

type Stories = ReturnType<typeof composeStories<typeof DefaultCutContentFilterStories>>;

const CutContentFilterStories: Stories = composeStories(DefaultCutContentFilterStories);

export const CutContentFilter: typeof CutContentFilterStories.Story = CutContentFilterStories.Story;
