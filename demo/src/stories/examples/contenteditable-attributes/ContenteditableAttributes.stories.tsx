import type {StoryObj} from '@storybook/react';
import {useArgs} from 'storybook/preview-api';

import {
    ContenteditableAttributes,
    type ContenteditableAttributesProps,
} from './ContenteditableAttributes';

export const Story: StoryObj<typeof ContenteditableAttributes> = {
    args: {
        contenteditableAttributes: {'aria-invalid': 'false'},
    },
    render: function Render() {
        const [args] = useArgs<ContenteditableAttributesProps>();

        return <ContenteditableAttributes {...args} />;
    },
};
Story.storyName = 'Contenteditable attributes';

export default {
    title: 'Examples / Contenteditable attributes',
    component: ContenteditableAttributes,
    argTypes: {
        contenteditableAttributes: {
            control: {type: 'object'},
            description: 'HTML attribute names and string values passed to the editable element.',
        },
    },
};
