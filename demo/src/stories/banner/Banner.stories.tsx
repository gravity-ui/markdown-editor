import type {Meta, StoryObj} from '@storybook/react';

import {BannerExample} from './Banner';

export default {
    title: 'Extensions / Landing / Banner',
    component: BannerExample,
} satisfies Meta<typeof BannerExample>;
export const Banner: StoryObj<typeof BannerExample> = {};

const title = '::banner-title[Team portal]{size="2"}';
const content =
    ':::banner-content\nRead the **guide** and open the [portal](/portal).\n\nAsk the team in the chat.\n:::';
const buttons = [
    ':button[Open](/portal){view="action" color="standard"}',
    ':button[Guide](/guide){view="normal" color="gray"}',
    ':button[Chat](/chat){view="flat" color="standard"}',
].join(' ');
const image = '::banner-image[Abstract illustration](assets/banner-image.webp)';
const background = 'bg-image="assets/banner-background.webp"';

const layoutBanner = (attrs: string, parts: string[]) =>
    [`:::banner{width="l" ${attrs}}`, ...parts, ':::'].join('\n\n');

// The same Markdown in both themes: the fill and the text take the colors of the page theme.
export const Layout: StoryObj<typeof BannerExample> = {
    args: {
        initial: [
            layoutBanner('bg-color="yellow-light"', [title, content, buttons]),
            layoutBanner('bg-color="yellow-light"', [title, content, buttons, image]),
            layoutBanner(background, [title, content, buttons, image]),
            layoutBanner(`${background} bg-theme="light" bg-image-blur="true"`, [
                title,
                content,
                buttons,
            ]),
        ].join('\n\n'),
    },
};
