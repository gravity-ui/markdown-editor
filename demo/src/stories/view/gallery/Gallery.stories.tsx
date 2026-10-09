import transform from '@diplodoc/transform';
import type {StoryObj} from '@storybook/react';

import {ViewWithGallery} from './ViewWithGallery';
import {galleryMarkup} from './markup';

export const Story: StoryObj<typeof ViewWithGallery> = {
    args: {
        html: transform(galleryMarkup).result.html,
    },
};
Story.storyName = 'View gallery';

export default {
    title: 'View / Gallery',
    component: ViewWithGallery,
};
