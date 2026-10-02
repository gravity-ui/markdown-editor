const image = 'https://storage.yandexcloud.net/gravity-ui/markdown-editor/header-cover.png';
const decor =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><circle cx='120' cy='120' r='108' fill='white' fill-opacity='0.22'/></svg>";
const tile =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='3.5' fill='white' fill-opacity='0.45'/></svg>";

const cover = (title: string, attrs: string, content = '') =>
    `:::header[${title}]{${attrs}}\n\n${content}\n\n:::`;
const covers = (...items: string[]) => items.join('\n\n');

export const markup = {
    empty: cover('', 'fill="blue"'),
    formats: covers(
        cover('Портал команды Вики', 'fill="blue"', 'Релизы, дежурства, контакты.'),
        cover('Дежурства', 'format="small" bg="fill" fill="navy"'),
    ),
    backgrounds: covers(
        '# Слой фона',
        cover('Сплошная заливка', 'bg="fill" fill="yellow"'),
        cover('Заливка с фигурами', 'fill="blue"'),
        cover('Градиент', 'bg="gradient" fill="indigo" fill2="violet"'),
        cover('Меш-градиент', 'bg="mesh" fill="violet" fill2="sky"'),
        cover('Паттерн', 'bg="pattern" fill="sky"'),
        cover(
            'Декор из файла',
            `bg="fill" fill="sand" image="${decor}" layer="object" fit="whole" focus="right"`,
        ),
        cover('Плитка из файла', `bg="fill" fill="sky" image="${tile}" layer="tile" scale="large"`),
        '# Изображение и эффект',
        cover('Фотография', `fill="blue" image="${image}" text="dark"`),
        cover('Размытие', `fill="blue" effect="blur" image="${image}"`),
        cover('Затемнение', `fill="blue" effect="darken" image="${image}"`),
        cover('Цвет слева, фото справа', `fill="sand" effect="fade" image="${image}"`),
    ),
    angles: covers(
        cover('По диагонали', 'bg="gradient" fill="indigo" fill2="violet"'),
        cover('Вправо', 'bg="gradient" fill="indigo" fill2="violet" direction="right"'),
        cover('Вниз', 'bg="gradient" fill="indigo" fill2="violet" direction="down"'),
        cover('Крупный узор', 'bg="pattern" fill="sky" scale="large"'),
    ),
    layers: covers(
        cover('На всю площадь', `fill="blue" image="${image}" text="dark"`),
        cover(
            'Отдельный объект',
            `bg="fill" fill="sand" image="${decor}" layer="object" fit="whole" focus="right"`,
        ),
        cover('Плиткой', `bg="fill" fill="sky" image="${tile}" layer="tile"`),
    ),
    crops: covers(
        cover('Заполнить', `fill="navy" image="${image}" text="light"`),
        cover('Показать целиком', `fill="navy" image="${image}" fit="whole" text="light"`),
        cover('Справа', `fill="navy" image="${image}" focus="right" text="light"`),
        cover('Сверху слева', `fill="navy" image="${image}" focus="top-left" text="light"`),
    ),
    fills: covers(
        ...[
            'blue',
            'indigo',
            'purple',
            'violet',
            'teal',
            'green',
            'sky',
            'amber',
            'yellow',
            'sand',
            'red',
            'navy',
        ].map((fill) => cover(fill, `bg="fill" fill="${fill}"`)),
    ),
    seeds: covers(
        cover('Диагональ', 'fill="purple" shapes="diagonal"'),
        cover('Угол', 'fill="purple" shapes="corner"'),
        cover('По краям', 'fill="purple" shapes="edges"'),
        cover('Внизу', 'fill="purple" shapes="bottom"'),
        cover('Врассыпную', 'bg="mesh" fill="indigo" fill2="red" shapes="scatter"'),
    ),
    insideCut: [
        '{% cut "Обложка внутри ката" %}',
        '',
        cover('Портал команды Вики', 'fill="green"'),
        '',
        '{% endcut %}',
    ].join('\n'),
    unknownValues: cover('Неизвестные значения', 'format="huge" bg="rainbow" fill="magenta"'),
    content: cover(
        'Портал команды Вики',
        'bg="gradient" fill="indigo" fill2="purple"',
        '::action[Открыть график](/wiki/duty){type="button" color="brand"}\n\n::action[Подробнее](/wiki/help){type="link" color="brand"}\n\nРелизы, дежурства, контакты.',
    ),
};
