import * as DefaultMarkdownStories from '../../src/stories/markdown/Markdown.stories';

import {composeStories} from './utils/compose-stories';

export const MarkdownStories = composeStories(DefaultMarkdownStories, {
    stickyToolbar: false,
    devTools: false,
    syncMarkupToUrl: false,
});
