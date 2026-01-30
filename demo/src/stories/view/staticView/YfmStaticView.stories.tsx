import transform from '@diplodoc/transform';
import {YfmStaticView} from '@gravity-ui/markdown-editor/view';
import type {StoryObj} from '@storybook/react';

import {markup} from '../../../defaults/content';

export const Story: StoryObj<typeof YfmStaticView> = {
    args: {
        html: transform(markup).result.html,
    },
};
Story.storyName = 'Static view';

export default {
    title: 'View / YfmStaticView',
    component: YfmStaticView,
};
