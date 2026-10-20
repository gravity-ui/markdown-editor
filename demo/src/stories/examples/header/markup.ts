const badge =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><circle cx='120' cy='120' r='108' fill='royalblue'/><circle cx='120' cy='120' r='64' fill='gold'/></svg>";
const tile =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M16 4 L28 16 L16 28 L4 16Z' fill='royalblue' fill-opacity='0.35'/></svg>";
const landscape =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'><rect width='1200' height='600' fill='lightsteelblue'/><circle cx='900' cy='180' r='90' fill='gold'/><path d='M0 420 Q300 260 600 400 T1200 360 V600 H0Z' fill='seagreen'/><path d='M0 500 Q400 380 800 480 T1200 470 V600 H0Z' fill='darkgreen'/></svg>";

const text =
    'Everything that you dreamed of can be brought to life exactly at the moment when you decide to win.';
const longText = [
    text,
    'A cover grows with its content: the height of the format is the smallest height of the block.',
    'This third paragraph pushes the block past the small format.',
];

const block = (open: string, ...parts: string[]) => [open, ...parts, ':::'].join('\n\n');
const header = (attrs: string, ...slots: string[]) =>
    block(attrs ? `:::header{${attrs}}` : ':::header', ...slots);
const title = (value: string, attrs = '') => `::header-title[${value}]${attrs && `{${attrs}}`}`;
const content = (...blocks: string[]) => block(':::header-content', ...blocks);
const image = (alt: string, src: string, attrs = '') =>
    `::header-image[${alt}](${src})${attrs && `{${attrs}}`}`;
const action = (label: string, attrs = '') =>
    `::action[${label}](https://example.com)${attrs && `{${attrs}}`}`;
const actions = (...items: string[]) => block(':::header-actions', ...items);
const covers = (...items: string[]) => items.join('\n\n');

const primary = action('Get started', 'color="blue"');
const secondary = action('Learn more');
const page = (attrs: string) =>
    header(attrs, title('Your title'), content(text), actions(primary, secondary));

/** `yellow-light` → `Yellow light`. */
const label = (value: string) => value[0].toUpperCase() + value.slice(1).replace(/-/g, ' ');
const each = (
    values: string[],
    name: (value: string) => string,
    markup: (value: string) => string,
) => Object.fromEntries(values.map((value) => [name(value), markup(value)]));

const aligns = ['left', 'center', 'right'];
const verticals = ['top', 'center', 'bottom'];
const formats = ['small', 'medium', 'large'];
const borders = ['none', 'solid', 'dashed', 'dotted'];
const palette = [
    'grey',
    'yellow-light',
    'yellow',
    'red-light',
    'red',
    'purple-light',
    'purple',
    'blue-light',
    'blue',
    'green-light',
    'green',
];
const textColors = ['system', 'grey', 'yellow', 'red', 'purple', 'blue', 'green'];
const focuses = [
    'center',
    'top',
    'right',
    'bottom',
    'left',
    'top-left',
    'top-right',
    'bottom-right',
    'bottom-left',
];
const decors = ['none', 'darken', 'lighten', 'blur', 'gradient', 'mesh', 'shapes', 'pattern'];
const directions = ['diagonal', 'right', 'down'];
const shapes = ['diagonal', 'corner', 'edges', 'bottom', 'scatter'];
const scales = ['small', 'medium', 'large'];

/** Второй цвет нужен только слоям `gradient` и `mesh`. */
const decorAttrs = (decor: string) =>
    ['gradient', 'mesh'].includes(decor) ? `fill2="purple" decor="${decor}"` : `decor="${decor}"`;

/**
 * Примеры сгруппированы по темам: группа → имя примера → разметка.
 * Имена групп и примеров совпадают с каталогом варианта с плоским телом: по ним сравнивают синтаксисы.
 * Адрес `cover.png` передаёт история: так примеры читаются и в юнит-тестах без сборщика.
 */
export function getHeaderExamples(cover: string): Record<string, Record<string, string>> {
    return {
        Alignment: Object.fromEntries(
            verticals.flatMap((vertical) =>
                aligns.map((align) => [
                    `${label(align)}, ${vertical}`,
                    page(`fill="blue-light" align="${align}" vertical="${vertical}"`),
                ]),
            ),
        ),
        Height: {
            ...each(formats, label, (format) => page(`format="${format}" fill="blue-light"`)),
            'Small, short content': header(
                'format="small" fill="blue-light"',
                title('Only a title'),
            ),
            'Small, long content': header(
                'format="small" fill="blue-light"',
                title('Your title'),
                content(...longText),
                actions(primary, secondary),
            ),
        },
        Width: Object.fromEntries(
            ['true', 'false'].flatMap((fixed) =>
                ['rounded', 'bleed'].map((edges) => [
                    `${fixed === 'true' ? 'Fixed' : 'Full width'}, ${edges}`,
                    header(
                        `fixed="${fixed}" edges="${edges}" fill="blue-light"`,
                        title('Your title'),
                        content(`${text} ${text}`),
                    ),
                ]),
            ),
        ),
        Border: Object.fromEntries(
            borders.flatMap((border) =>
                ['system', 'blue-light'].map((fill) => [
                    `${label(border)}, ${fill} fill`,
                    header(
                        `format="small" border="${border}" fill="${fill}"`,
                        title(`border="${border}"`),
                        content(text),
                    ),
                ]),
            ),
        ),
        Fill: each(['system', ...palette], label, (fill) =>
            header(`format="small" fill="${fill}"`, title(`fill="${fill}"`), content(text)),
        ),
        'Background image': {
            ...Object.fromEntries(
                ['cover', 'object'].flatMap((layout) =>
                    ['crop', 'whole'].map((fit) => [
                        `${label(layout)}, ${fit}`,
                        header(
                            layout === 'cover'
                                ? `fill="blue-light" bg="image" image="${landscape}" layout="cover" fit="${fit}"`
                                : `fill="blue-light" bg="image" image="${badge}" layout="object" fit="${fit}" focus="right"`,
                            title(`layout="${layout}" fit="${fit}"`),
                            content(text),
                        ),
                    ]),
                ),
            ),
            ...each(
                scales,
                (scale) => `Tile, ${scale}`,
                (scale) =>
                    header(
                        `format="small" fill="blue-light" bg="image" image="${tile}" layout="tile" scale="${scale}"`,
                        title(`layout="tile" scale="${scale}"`),
                    ),
            ),
            ...each(
                focuses,
                (focus) => `Focus ${focus}`,
                (focus) =>
                    header(
                        `format="small" bg="image" image="${landscape}" focus="${focus}"`,
                        title(`focus="${focus}"`),
                    ),
            ),
        },
        'Decor layer': {
            ...each(
                decors,
                (decor) => `${label(decor)} over fill`,
                (decor) =>
                    header(
                        `format="small" fill="blue-light" ${decorAttrs(decor)}`,
                        title(`decor="${decor}"`),
                        content(text),
                    ),
            ),
            ...each(
                decors,
                (decor) => `${label(decor)} over image`,
                (decor) =>
                    header(
                        `format="small" bg="image" image="${landscape}" fill="blue-light" ${decorAttrs(decor)}`,
                        title(`decor="${decor}"`),
                        content(text),
                    ),
            ),
            ...each(
                directions,
                (direction) => `Gradient, ${direction}`,
                (direction) =>
                    header(
                        `format="small" fill="blue-light" fill2="purple" decor="gradient" direction="${direction}"`,
                        title(`direction="${direction}"`),
                    ),
            ),
            ...each(
                shapes,
                (shape) => `Mesh, ${shape}`,
                (shape) =>
                    header(
                        `format="small" fill="blue-light" fill2="purple" decor="mesh" shape="${shape}"`,
                        title(`shape="${shape}"`),
                    ),
            ),
            ...each(
                shapes,
                (shape) => `Shapes, ${shape}`,
                (shape) =>
                    header(
                        `format="small" fill="blue" decor="shapes" shape="${shape}"`,
                        title(`shape="${shape}"`),
                    ),
            ),
            ...each(
                scales,
                (scale) => `Pattern, ${scale}`,
                (scale) =>
                    header(
                        `format="small" fill="blue-light" decor="pattern" scale="${scale}"`,
                        title(`scale="${scale}"`),
                    ),
            ),
        },
        'Text color': Object.fromEntries(
            ['blue-light', 'blue'].flatMap((fill) =>
                textColors.map((color) => [
                    `${label(color)} on ${fill === 'blue' ? 'a dark' : 'a light'} fill`,
                    header(
                        `format="small" fill="${fill}" text="${color}"`,
                        title(`text="${color}"`),
                        content(text),
                    ),
                ]),
            ),
        ),
        'Content image': {
            ...Object.fromEntries(
                ['right', 'left'].flatMap((side) =>
                    ['crop', 'whole'].map((fit) => [
                        `${label(side)}, ${fit}`,
                        header(
                            'fill="blue-light"',
                            title('Your title'),
                            content(text),
                            image('Abstract waves', cover, `side="${side}" fit="${fit}"`),
                            actions(primary, secondary),
                        ),
                    ]),
                ),
            ),
            ...each(
                focuses.slice(1),
                (focus) => `Focus ${focus}`,
                (focus) =>
                    header(
                        'format="small" fill="blue-light"',
                        title(`focus="${focus}"`),
                        image('Abstract waves', cover, `focus="${focus}"`),
                    ),
            ),
            'With a background image': header(
                `bg="image" image="${landscape}"`,
                title('Two images'),
                content(text),
                image('Abstract waves', cover, 'side="left"'),
                actions(primary),
            ),
        },
        Title: each(
            ['1', '2', '3', '4', '5', '6'],
            (size) => `Level ${size}`,
            (size) =>
                header(
                    'format="small" fill="blue-light"',
                    title(`Level ${size}`, `size="${size}"`),
                ),
        ),
        Content: {
            Marks: header(
                'fill="green-light"',
                title('Marks'),
                content(
                    '**Bold**, _italic_, ++underline++, ~~strike~~, ##monospace##, `code`, [link](https://example.com), ==highlight== and {red}(color).',
                ),
            ),
            'Heading inside content': header(
                'fill="purple-light"',
                title('Release notes'),
                content('## What is new', text),
            ),
            Quote: header(
                'fill="purple-light"',
                title('Quote'),
                content('> Short words are best.'),
            ),
            'Dropped lists, table and code': header(
                'fill="yellow-light"',
                title('Only text remains'),
                content(
                    'The lists, the table and the code block below are not shown.',
                    '- Faster search\n- Dark theme\n- Offline mode',
                    '1. Install\n2. Sign in',
                    '| Column | Column |\n| --- | --- |\n| Cell | Cell |',
                    '```\nconst hidden = true;\n```',
                ),
            ),
        },
        Actions: {
            One: header('fill="blue-light"', title('One action'), actions(primary)),
            Two: header('fill="blue-light"', title('Two actions'), actions(primary, secondary)),
            Three: header(
                'fill="blue-light"',
                title('Three actions'),
                actions(primary, secondary, action('Read the docs', 'type="link"')),
            ),
            'Four, the last is dropped': header(
                'fill="blue-light"',
                title('Four actions'),
                actions(
                    action('First', 'color="blue"'),
                    action('Second'),
                    action('Third', 'type="link"'),
                    action('Fourth', 'type="link" color="blue"'),
                ),
            ),
            ...each(
                ['button', 'link'],
                (type) => `Type ${type}`,
                (type) =>
                    header(
                        'format="small" fill="blue-light"',
                        title(`type="${type}"`),
                        actions(action(label(type), `type="${type}"`)),
                    ),
            ),
            ...each(
                ['system', ...palette],
                (color) => `Color ${color}`,
                (color) =>
                    header(
                        'format="small" border="solid"',
                        title(`color="${color}"`),
                        actions(
                            action('Button', `type="button" color="${color}"`),
                            action('Link', `type="link" color="${color}"`),
                        ),
                    ),
            ),
        },
        'Edge cases': {
            'Empty block': header(''),
            'No title': header('fill="green-light"', content(text), actions(primary)),
            'Unknown parameter': header(
                'fill="green-light" color="red"',
                title('Unknown parameter'),
            ),
            'Unknown value': header(
                'format="huge" fill="magenta" decor="sparkles"',
                title('Unknown value'),
            ),
            'Inside a cut': [
                '{% cut "Cover inside a cut" %}',
                header('fill="green-light"', title('Inside a cut'), content(text)),
                '{% endcut %}',
            ].join('\n\n'),
            'Two covers in a row': covers(
                header('format="small" fill="blue-light"', title('First')),
                header('format="small" fill="yellow-light"', title('Second')),
            ),
            'Directives outside a cover': covers(
                'The directives below are outside a cover and are not shown.',
                title('Lost title'),
                image('Lost image', cover),
                action('Lost action'),
            ),
        },
    };
}
