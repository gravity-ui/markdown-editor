import transform from '@diplodoc/transform';
import {YfmStaticView, withCodeBlockActions} from '@gravity-ui/markdown-editor/view';
import type {StoryObj} from '@storybook/react';

import {markup} from '../../../defaults/content';

const YFMViewer = withCodeBlockActions({
    lineWrappingButton: true,
    // change after update @diplodoc/transform
    codeBlockSelector: '.yfm-clipboard',
})(YfmStaticView);

export const Story: StoryObj<typeof YFMViewer> = {
    args: {
        html: transform(markup).result.html,
    },
};
Story.storyName = 'Static view';

export default {
    title: 'View / YfmStaticView',
    component: YFMViewer,
};
