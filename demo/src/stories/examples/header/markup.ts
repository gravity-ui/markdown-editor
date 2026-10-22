import designImage from './cover.png';

export const button = (label: string, attrs = '') =>
    `:::button${attrs ? `{${attrs}}` : ''}\n${label}\n:::`;
export const cover = (title: string, attrs = '', content = '', media = '', buttons = '') =>
    `:::header${attrs ? `{${attrs}}` : ''}\n\n${media}\n\n:::header-title\n${title}\n:::\n\n:::header-content\n${content}\n:::\n\n${buttons}\n\n:::`;
const covers = (...items: string[]) => items.join('\n\n');
const description =
    'A short description of the page: what it covers and who it is for. Readers will see these lines first.';
const designButtons = covers(
    button('Button', 'href="/page"'),
    button('Button', 'href="/page" view="normal"'),
    button('Button', 'href="/page" view="flat"'),
);
const media = `:::header-image{src="${designImage}" alt="Abstract blue shapes"}\n:::`;
const emptyMedia = ':::header-image\n:::';
const textPalette = ['gray', 'yellow', 'orange', 'red', 'green', 'blue', 'violet']
    .map((color) => `{${color}}(${color})`)
    .join(' · ');

export const markup = {
    imageThemes: covers(
        `Outside the cover: ${textPalette} · [Link](/page)`,
        ...['system', 'light', 'dark'].map((theme) =>
            cover(
                `${theme} text theme`,
                `image="${designImage}" bg-image-theme="${theme}"`,
                `Plain text · ${textPalette} · [Link](/page)`,
                '',
                designButtons,
            ),
        ),
    ),
    designSettings: cover(
        'Your title',
        `image="${designImage}" image-name="abstract-dark-blue.png"`,
        description,
        media,
        button('Button', 'href="/page"'),
    ),
    design: cover('Your title', '', description, media, designButtons),
    designSizes: covers(
        ...['s', 'm', 'l'].map((height) =>
            cover('Your title', `height="${height}"`, description, media, button('Button')),
        ),
    ),
    designLayouts: covers(
        ...['left', 'center', 'right'].map((align) =>
            cover('Your title', `align="${align}"`, description, media, designButtons),
        ),
    ),
    widths: covers(
        ...['s', 'm', 'l', 'full'].map((width) =>
            cover(`${width} width`, `width="${width}"`, description),
        ),
    ),
    empty: cover('', '', '', emptyMedia, button('Button')),
    backgrounds: covers(
        cover('No background'),
        cover('Palette background', 'fill="blue-light"', description),
        cover(
            'Background and content image',
            `image="${designImage}" bg-image-theme="dark"`,
            description,
            media,
        ),
        cover(
            'Blurred background',
            `image="${designImage}" effect="blur" bg-image-theme="dark" shapes="diagonal"`,
            description,
        ),
    ),
    shapes: covers(
        ...['diagonal', 'corner', 'edges', 'bottom', 'scatter'].map((shapes) =>
            cover(shapes, `fill="blue-light" shapes="${shapes}"`, description),
        ),
    ),
    fills: covers(
        ...[
            'grey',
            'yellow-light',
            'red-light',
            'purple-light',
            'blue-light',
            'green-light',
            'yellow',
            'red',
            'purple',
            'blue',
            'green',
        ].map((fill) => cover(fill, `fill="${fill}"`, description)),
    ),
    buttons: covers(
        ...['action', 'normal', 'outlined', 'flat'].flatMap((view) =>
            ['default', 'gray', 'blue', 'green', 'yellow', 'orange', 'red', 'violet'].map((color) =>
                button(`${view} ${color}`, `view="${view}" color="${color}" href="/page"`),
            ),
        ),
    ),
    content: cover(
        'Your title',
        '',
        '**Bold**, *italic*, ~~strikethrough~~, `code`, {red}(red) and [link](/page).',
        '',
        designButtons,
    ),
    insideCut: `:::cut[Cover]\n\n${cover('Inside a cut', 'fill="blue-light"', description, media, designButtons)}\n\n:::`,
    unknownValues: cover(
        'Unknown values use defaults',
        'height="unknown" width="unknown" text="unknown" shapes="unknown"',
    ),
    longContent: cover(
        'A long title that wraps naturally and keeps every word visible',
        'width="s"',
        description.repeat(8),
        media,
        designButtons,
    ),
};
