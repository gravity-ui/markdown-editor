import {buttonExamples} from '../../src/stories/button/canvas';

import {BannerExample} from './Banner.helpers';
import {composeStories} from './utils/compose-stories';

export const ButtonStories = composeStories({
    default: {component: BannerExample},
    Button: {args: {initial: buttonExamples}},
});
