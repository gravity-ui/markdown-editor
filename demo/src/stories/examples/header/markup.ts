const decor =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><circle cx='120' cy='120' r='108' fill='white' fill-opacity='0.22'/></svg>";
const tile =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='3.5' fill='white' fill-opacity='0.45'/></svg>";
const landscape =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'><rect width='1200' height='600' fill='lightsteelblue'/><circle cx='900' cy='180' r='90' fill='gold'/><path d='M0 420 Q300 260 600 400 T1200 360 V600 H0Z' fill='seagreen'/><path d='M0 500 Q400 380 800 480 T1200 470 V600 H0Z' fill='darkgreen'/></svg>";

const text =
    'Everything that you dreamed of can be brought to life exactly at the moment when you decide to win.';

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

const primary = action('Get started', 'color="brand"');
const secondary = action('Learn more');
const page = (attrs: string) =>
    header(attrs, title('Your title'), content(text), actions(primary, secondary));

/**
 * Примеры сгруппированы по темам: группа → имя примера → разметка.
 * Адрес `cover.png` передаёт история: так примеры читаются и в юнит-тестах без сборщика.
 */
export function getHeaderExamples(cover: string): Record<string, Record<string, string>> {
    return {
        Layout: {
            'Small, aligned left': page('format="small" align="left"'),
            'Medium, centered': page('format="medium" align="center"'),
            'Large, aligned right': page('format="large" align="right"'),
            'Top, fixed width': page('format="large" vertical="top" fixed="true"'),
            'Bottom, full width': page('format="large" vertical="bottom" fixed="false"'),
        },
        Backgrounds: {
            Surface: header('bg="surface"', title('Surface'), content(text)),
            Fill: header('bg="fill" fill="yellow"', title('Fill'), content(text)),
            Shapes: header('bg="shapes" fill="purple"', title('Shapes'), content(text)),
            'Gradient directions': covers(
                header('bg="gradient" fill="indigo" fill2="violet"', title('Diagonal')),
                header(
                    'bg="gradient" fill="indigo" fill2="violet" direction="right"',
                    title('Right'),
                ),
                header(
                    'bg="gradient" fill="indigo" fill2="violet" direction="down"',
                    title('Down'),
                ),
            ),
            'Mesh shapes': covers(
                header('bg="mesh" fill="indigo" fill2="red" shapes="scatter"', title('Scatter')),
                header('bg="mesh" fill="teal" fill2="sky" shapes="corner"', title('Corner')),
                header('bg="mesh" fill="violet" fill2="amber" shapes="edges"', title('Edges')),
            ),
            'Pattern scale': covers(
                header('format="small" bg="pattern" fill="sky" scale="small"', title('Small')),
                header('format="small" bg="pattern" fill="sky" scale="large"', title('Large')),
            ),
        },
        Palette: {
            'Fill colors': covers(
                ...['blue-light', 'green', 'amber', 'red-light', 'navy', 'grey'].map((fill) =>
                    header(`format="small" bg="fill" fill="${fill}"`, title(fill)),
                ),
            ),
        },
        'Background image': {
            'Crop to center, no effect': header(
                `fill="navy" image="${landscape}" text="dark"`,
                title('Crop to center'),
                content(text),
            ),
            'Crop to a corner': header(
                `fill="navy" image="${landscape}" focus="top-right" text="dark"`,
                title('Top right corner'),
            ),
            'Crop to an edge': header(
                `fill="navy" image="${landscape}" focus="bottom" text="light"`,
                title('Bottom edge'),
            ),
            'Whole image': header(
                `fill="navy" image="${landscape}" fit="whole" text="light"`,
                title('Whole image'),
            ),
            Darken: header(
                `image="${cover}" effect="darken"`,
                title('Darken'),
                content(text),
                actions(primary),
            ),
            Blur: header(
                `image="${cover}" effect="blur"`,
                title('Blur'),
                content(text),
                actions(primary),
            ),
            Fade: header(
                `fill="sand" image="${landscape}" effect="fade"`,
                title('Fade'),
                content(text),
                actions(primary),
            ),
            'Object layer': header(
                `bg="fill" fill="sand" image="${decor}" layer="object" fit="whole" focus="right"`,
                title('Object over the fill'),
                content(text),
            ),
            'Tile layer and scale': covers(
                header(
                    `bg="fill" fill="sky" image="${tile}" layer="tile" scale="small"`,
                    title('Small tiles'),
                ),
                header(
                    `bg="fill" fill="sky" image="${tile}" layer="tile" scale="large"`,
                    title('Large tiles'),
                ),
            ),
        },
        'Content image': {
            'Right, small, aligned left': header(
                'format="small" bg="surface"',
                title('Your title'),
                content(text),
                image('Abstract waves', cover, 'side="right"'),
                actions(primary, secondary),
            ),
            'Left, medium, centered': header(
                'bg="surface" align="center"',
                title('Your title'),
                content(text),
                image('Abstract waves', cover, 'side="left"'),
                actions(primary, secondary),
            ),
            'Left, large, aligned right, whole': header(
                'format="large" bg="fill" fill="blue-light" align="right"',
                title('Your title'),
                content(text),
                image('Abstract waves', cover, 'side="left" fit="whole"'),
                actions(primary, secondary),
            ),
            'Background and content images': header(
                `image="${landscape}" text="dark"`,
                title('Two images'),
                content(text),
                image('Abstract waves', cover, 'focus="top"'),
                actions(primary),
            ),
        },
        Title: {
            'Levels 1 to 6': covers(
                ...['1', '2', '3', '4', '5', '6'].map((size) =>
                    header(
                        'format="small" bg="fill" fill="blue-light"',
                        title(`Level ${size}`, `size="${size}"`),
                    ),
                ),
            ),
        },
        Content: {
            Marks: header(
                'bg="fill" fill="green-light"',
                title('Marks'),
                content(
                    '**Bold**, _italic_, ++underline++, ~~strike~~, ##monospace##, `code`, [link](https://example.com), ==highlight== and {red}(color).',
                ),
            ),
            'Heading and quote': header(
                'bg="fill" fill="purple-light" format="large"',
                title('Release notes'),
                content('## What is new', '> Short words are best.'),
            ),
            'Dropped lists, table and code': header(
                'bg="fill" fill="yellow-light"',
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
            One: header('fill="blue"', title('One action'), actions(primary)),
            Two: header('fill="blue"', title('Two actions'), actions(primary, secondary)),
            'Three, type and color': header(
                'fill="blue"',
                title('Three actions'),
                actions(
                    action('Button', 'type="button" color="brand"'),
                    action('Button', 'type="button" color="default"'),
                    action('Link', 'type="link" color="brand"'),
                ),
            ),
            'Four, the last is dropped': header(
                'fill="blue"',
                title('Four actions'),
                actions(
                    action('First', 'color="brand"'),
                    action('Second'),
                    action('Third', 'type="link"'),
                    action('Fourth', 'type="link" color="brand"'),
                ),
            ),
        },
        'Text color': {
            'On a light fill': covers(
                ...['auto', 'light', 'dark', 'brand'].map((value) =>
                    header(
                        `format="small" bg="fill" fill="yellow-light" text="${value}"`,
                        title(`text="${value}"`),
                    ),
                ),
            ),
            'On a dark image': covers(
                ...['auto', 'light', 'dark', 'brand'].map((value) =>
                    header(
                        `format="small" image="${cover}" text="${value}"`,
                        title(`text="${value}"`),
                    ),
                ),
            ),
        },
        'Edge cases': {
            'Empty block': header('fill="green"'),
            'No title': header('fill="green"', content(text), actions(primary)),
            'Unknown parameter': header('fill="green" color="red"', title('Unknown parameter')),
            'Unknown values': header(
                'format="huge" bg="rainbow" fill="magenta"',
                title('Unknown values'),
            ),
            'Inside a cut': [
                '{% cut "Cover inside a cut" %}',
                header('fill="green"', title('Inside a cut'), content(text)),
                '{% endcut %}',
            ].join('\n\n'),
            'Two covers in a row': covers(
                header('format="small" fill="sky"', title('First')),
                header('format="small" fill="amber"', title('Second')),
            ),
            'Slot directives outside a cover': covers(
                'The directives below are outside a cover and are not shown.',
                title('Lost title'),
                image('Lost image', cover),
                action('Lost action'),
            ),
        },
        Slots: {
            'Shuffled order': header(
                'bg="surface"',
                actions(primary, secondary),
                image('Abstract waves', cover),
                content(text),
                title('Slots in any order'),
            ),
            'Repeated slot': header(
                'fill="teal"',
                title('First title'),
                title('Second title is dropped'),
                content('First content.'),
                content('Second content is dropped.'),
            ),
            'No slots': header(
                'bg="gradient" fill="indigo" fill2="violet"',
                'Text outside a slot is dropped.',
            ),
        },
    };
}
