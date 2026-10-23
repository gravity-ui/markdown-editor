const text =
    'Everything that you dreamed of can be brought to life exactly at the moment when you decide to win.';
const longText = [
    text,
    'A cover grows with its content: the height of the format is the smallest height of the block.',
    'This third paragraph pushes the block past the small format.',
];

const block = (open: string, ...parts: string[]) => [open, ...parts, ':::'].join('\n\n');
const header = (title: string, attrs: string, ...body: string[]) =>
    block(`:::header${title && `[${title}]`}${attrs && `{${attrs}}`}`, ...body);
const image = (alt: string, src: string, attrs = '') =>
    `::image[${alt}](${src})${attrs && `{${attrs}}`}`;
const action = (label: string, attrs = '') =>
    `::action[${label}](https://example.com)${attrs && `{${attrs}}`}`;
const covers = (...items: string[]) => items.join('\n\n');

const primary = action('Get started', 'color="blue"');
const secondary = action('Learn more');
const page = (attrs: string) => header('Your title', attrs, text, primary, secondary);

/** `button` → `Button`. */
const label = (value: string) => value[0].toUpperCase() + value.slice(1);
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
/**
 * Кадр выходит за край блока только по одной оси, поэтому у угла виден сдвиг по одной оси.
 * Низкий блок шире фотографии и сдвигает кадр по вертикали, высокий — по горизонтали.
 * Фон высокого блока сдвигается по горизонтали, только если превью уже 750 пикселей.
 */
const isVertical = (focus: string) => ['center', 'top', 'bottom'].includes(focus);
const focusFormat = (focus: string) => (isVertical(focus) ? 'small' : 'large');
const focusName = (focus: string) =>
    focus.includes('-') ? `Focus ${focus}, horizontal shift` : `Focus ${focus}`;
const decors = ['none', 'darken', 'lighten', 'blur', 'gradient', 'mesh', 'shapes'];
const directions = ['diagonal', 'right', 'down'];
const shapes = ['diagonal', 'corner', 'edges', 'bottom', 'scatter'];

/** Поверх изображения заливку видно только у слоёв `gradient` и `mesh`. */
const decorAttrs = (decor: string) =>
    ['gradient', 'mesh'].includes(decor)
        ? `fill="blue-light" fill2="purple" decor="${decor}"`
        : `decor="${decor}"`;

/**
 * Примеры сгруппированы по темам: группа → имя примера → разметка.
 * Имена групп и примеров совпадают с каталогом варианта со слотами: по ним сравнивают синтаксисы.
 * Адреса `cover.png` и `landscape.jpg` передаёт история: так примеры читаются и в юнит-тестах без сборщика.
 */
export function getHeaderExamples(
    cover: string,
    landscape: string,
): Record<string, Record<string, string>> {
    return {
        Alignment: Object.fromEntries(
            verticals.flatMap((vertical) =>
                aligns.map((align) => [
                    `Align ${align}, vertical ${vertical}`,
                    page(`align="${align}" vertical="${vertical}" fill="blue-light"`),
                ]),
            ),
        ),
        Height: {
            ...each(
                formats,
                (format) => `Format ${format}`,
                (format) => page(`format="${format}" fill="blue-light"`),
            ),
            'Format small, short content': header(
                'Only a title',
                'format="small" fill="blue-light"',
            ),
            'Format small, long content': header(
                'Your title',
                'format="small" fill="blue-light"',
                ...longText,
                primary,
                secondary,
            ),
        },
        Width: Object.fromEntries(
            ['true', 'false'].flatMap((fixed) =>
                ['rounded', 'bleed'].map((edges) => [
                    `Edges ${edges}, fixed ${fixed}`,
                    header(
                        'Your title',
                        `edges="${edges}" fixed="${fixed}" fill="blue-light"`,
                        `${text} ${text}`,
                    ),
                ]),
            ),
        ),
        Border: Object.fromEntries(
            borders.flatMap((border) =>
                ['system', 'blue-light'].map((fill) => [
                    `Border ${border}, fill ${fill}`,
                    header('Your title', `format="small" border="${border}" fill="${fill}"`, text),
                ]),
            ),
        ),
        Fill: each(
            ['system', ...palette],
            (fill) => `Fill ${fill}`,
            (fill) => header('Your title', `format="small" fill="${fill}"`, text),
        ),
        'Background image': {
            ...Object.fromEntries(
                ['cover', 'object'].flatMap((layout) =>
                    ['crop', 'whole'].map((fit) => [
                        `Layout ${layout}, fit ${fit}`,
                        header(
                            'Your title',
                            // Заливку видно только там, где изображение не закрывает блок целиком.
                            layout === 'cover' && fit === 'crop'
                                ? `bg="${landscape}" layout="cover" fit="${fit}"`
                                : `bg="${landscape}" layout="${layout}" fit="${fit}" fill="blue-light"`,
                            text,
                        ),
                    ]),
                ),
            ),
            ...each(focuses, focusName, (focus) =>
                header(
                    'Your title',
                    `format="${focusFormat(focus)}" bg="${landscape}" focus="${focus}"`,
                ),
            ),
        },
        'Decor layer': {
            // `blur` на заливке не виден, а `gradient` и `mesh` показаны рядами своих параметров.
            ...each(
                ['none', 'darken', 'lighten', 'shapes'],
                (decor) => `Decor ${decor} over fill`,
                (decor) =>
                    header('Your title', `format="small" fill="blue-light" decor="${decor}"`, text),
            ),
            ...each(
                decors,
                (decor) => `Decor ${decor} over image`,
                (decor) =>
                    header(
                        'Your title',
                        `format="small" bg="${landscape}" ${decorAttrs(decor)}`,
                        text,
                    ),
            ),
            ...each(
                palette,
                (fill2) => `Fill2 ${fill2}`,
                (fill2) => header('Your title', `format="small" fill2="${fill2}" decor="gradient"`),
            ),
            ...each(
                directions,
                (direction) => `Decor gradient, direction ${direction}`,
                (direction) =>
                    header(
                        'Your title',
                        `format="small" fill="blue-light" fill2="purple" decor="gradient" direction="${direction}"`,
                    ),
            ),
            ...each(
                shapes,
                (shape) => `Decor mesh, shape ${shape}`,
                (shape) =>
                    header(
                        'Your title',
                        `format="small" fill="blue-light" fill2="purple" decor="mesh" shape="${shape}"`,
                    ),
            ),
            ...each(
                shapes,
                (shape) => `Decor shapes, shape ${shape}`,
                (shape) =>
                    header(
                        'Your title',
                        `format="small" fill="blue" decor="shapes" shape="${shape}"`,
                    ),
            ),
        },
        'Text color': Object.fromEntries(
            ['blue-light', 'blue'].flatMap((fill) =>
                textColors.map((color) => [
                    `Text ${color}, fill ${fill}`,
                    header('Your title', `format="small" fill="${fill}" text="${color}"`, text),
                ]),
            ),
        ),
        'Content image': {
            ...Object.fromEntries(
                ['right', 'left'].flatMap((side) =>
                    ['crop', 'whole'].map((fit) => [
                        `Side ${side}, fit ${fit}`,
                        header(
                            'Your title',
                            'fill="blue-light"',
                            text,
                            image('Abstract waves', cover, `side="${side}" fit="${fit}"`),
                            primary,
                            secondary,
                        ),
                    ]),
                ),
            ),
            ...each(focuses.slice(1), focusName, (focus) =>
                header(
                    'Your title',
                    `format="${focusFormat(focus)}" fill="blue-light"`,
                    isVertical(focus)
                        ? image('Abstract waves', cover, `focus="${focus}"`)
                        : image('Mountain lake', landscape, `focus="${focus}"`),
                ),
            ),
            'With a background image': header(
                'Two images',
                `bg="${landscape}"`,
                text,
                image('Abstract waves', cover, 'side="left"'),
                primary,
            ),
        },
        Title: each(
            ['1', '2', '3', '4', '5', '6'],
            (level) => `Level ${level}`,
            (level) => header(`Level ${level}`, `h="${level}" format="small" fill="blue-light"`),
        ),
        Content: {
            Marks: header(
                'Marks',
                'fill="green-light"',
                '**Bold**, _italic_, ++underline++, ~~strike~~, ##monospace##, `code`, [link](https://example.com), ==highlight== and {red}(color).',
            ),
            'Heading inside content': header(
                'Release notes',
                'fill="purple-light"',
                '## What is new',
                text,
            ),
            Quote: header('Quote', 'fill="purple-light"', '> Short words are best.'),
            'Dropped lists, table and code': header(
                'Only text remains',
                'fill="yellow-light"',
                'The lists, the table and the code block below are not shown.',
                '- Faster search\n- Dark theme\n- Offline mode',
                '1. Install\n2. Sign in',
                '| Column | Column |\n| --- | --- |\n| Cell | Cell |',
                '```\nconst hidden = true;\n```',
            ),
        },
        Actions: {
            One: header('One action', 'fill="blue-light"', primary),
            Two: header('Two actions', 'fill="blue-light"', primary, secondary),
            Three: header(
                'Three actions',
                'fill="blue-light"',
                primary,
                secondary,
                action('Read the docs', 'type="link"'),
            ),
            'Four, the last is dropped': header(
                'Four actions',
                'fill="blue-light"',
                action('First', 'color="blue"'),
                action('Second'),
                action('Third', 'type="link"'),
                action('Fourth', 'type="link" color="blue"'),
            ),
            ...each(
                ['button', 'link'],
                (type) => `Type ${type}`,
                (type) =>
                    header(
                        'Your title',
                        'format="small" fill="blue-light"',
                        action(label(type), `type="${type}"`),
                    ),
            ),
            ...each(
                ['system', ...palette],
                (color) => `Color ${color}`,
                (color) =>
                    header(
                        'Your title',
                        'format="small" border="solid"',
                        action('Button', `color="${color}"`),
                        action('Link', `type="link" color="${color}"`),
                    ),
            ),
        },
        Combinations: {
            'Travel guide': header(
                'Northern lakes',
                `format="large" vertical="top" bg="${landscape}" decor="lighten" text="green"`,
                'Six quiet routes through the mountains, with places to stay along the shore.',
                action('Plan a trip', 'color="green"'),
                action('See the map', 'type="link" color="green"'),
            ),
            'Photo essay': header(
                'A week without a signal',
                `format="large" align="center" bg="${landscape}" decor="blur"`,
                'Notes and pictures from a walk around the lake.',
                action('Read the story', 'color="blue"'),
            ),
            'Field notes': header(
                'Field notes',
                `h="2" bg="${landscape}" focus="bottom" fill="green-light" fill2="blue-light" decor="gradient" direction="right"`,
                'Weather, water level and trail conditions, updated every morning.',
                image('Abstract waves', cover, 'side="left"'),
                action('Open the log', 'color="green"'),
                secondary,
            ),
            'Spring release': header(
                'Spring release',
                'fill="green-light"',
                'Offline mode, faster search and a new dark theme.',
                image('Abstract waves', cover),
                action('Update now', 'color="green"'),
                action('Release notes', 'type="link" color="green"'),
            ),
            'Developer portal': header(
                'Build on our platform',
                'format="large" edges="bleed" fixed="false" fill="blue" fill2="purple" decor="mesh" shape="corner"',
                'Guides, API reference and examples for every language we support.',
                action('Get an API key', 'color="purple-light"'),
                action('Browse the docs', 'type="link"'),
            ),
            'Team handbook': header(
                'Team handbook',
                'h="2" border="dashed" fill="yellow-light"',
                'How we plan, review and ship. **Start here** if you joined this month.',
                action('Open the handbook', 'color="yellow"'),
                secondary,
            ),
            'Security notice': header(
                'Rotate your access tokens',
                'h="3" format="small" border="solid" fill="red-light" text="red"',
                'Tokens created before March stop working on Monday.',
                action('How to rotate', 'type="link" color="red"'),
            ),
            'Weekly digest': header(
                'Weekly digest',
                'h="4" format="small" align="right" vertical="top" fill="grey" decor="shapes" shape="scatter"',
                'Twelve merged changes, three new pages, one fixed outage.',
            ),
            'Research lab': header(
                'Research lab',
                'h="2" fill="purple" fill2="blue" decor="gradient" direction="right"',
                '> We publish every experiment, including the ones that failed.',
                image('Abstract waves', cover, 'side="left"'),
                action('Read the papers', 'color="purple-light"'),
            ),
            'Photo of the month': header(
                '',
                `edges="bleed" align="right" vertical="bottom" border="solid" bg="${landscape}" layout="object" focus="top" fill="blue-light"`,
                action('Photo of the month', 'color="blue"'),
            ),
            'Evening webinar': header(
                'Evening webinar',
                'align="center" fill="purple" decor="shapes" shape="edges"',
                'Thursday, 19:00. Questions from the audience at the end.',
                action('Register', 'color="yellow"'),
                action('Add to calendar', 'type="link" color="purple-light"'),
            ),
            'Getting started': header(
                'Getting started',
                'align="center" border="dotted"',
                'Install the package, connect the editor and write your first page.',
                action('Install', 'color="blue"'),
                secondary,
                action('Ask a question', 'type="link" color="blue"'),
            ),
            Changelog: header(
                'Version 2.4',
                'h="5" format="small" edges="bleed" align="right" vertical="bottom" fill="green"',
                'Released on 14 October. Fixes for tables, lists and the toolbar.',
                action('All versions', 'type="link"'),
            ),
        },
        'Edge cases': {
            'Empty block': header('', ''),
            'No title': header('', 'fill="green-light"', text, primary),
            'Unknown parameter': header('Unknown parameter', 'fill="green-light" color="red"'),
            'Unknown value': header(
                'Unknown value',
                'format="huge" fill="magenta" decor="sparkles"',
            ),
            'Inside a cut': [
                '{% cut "Cover inside a cut" %}',
                header('Inside a cut', 'fill="green-light"', text),
                '{% endcut %}',
            ].join('\n\n'),
            'Two covers in a row': covers(
                header('First', 'format="small" fill="blue-light"'),
                header('Second', 'format="small" fill="yellow-light"'),
            ),
            'Directives outside a cover': covers(
                'The directives below are outside a cover and are not shown.',
                image('Lost image', cover),
                action('Lost action'),
            ),
        },
    };
}
