const image = 'https://storage.yandexcloud.net/gravity-ui/markdown-editor/header-cover.png';

export const markup = {
    empty: `::header[]{fill="blue"}\n`,

    formats: [
        '::header[Портал команды Вики]{fill="blue"}',
        '',
        '::header[Дежурства]{format="small" fill="navy" decor="none"}',
        '',
    ].join('\n'),

    /** Девять сценариев фона из макета. */
    backgrounds: [
        '# Сценарии фона',
        '',
        '::header[Сплошной фон]{fill="blue" decor="none"}',
        '',
        '::header[Градиент]{bg="gradient" fill="blue" fill2="purple"}',
        '',
        '::header[Декор поверх заливки]{fill="blue"}',
        '',
        `::header[Изображение]{bg="image" fill="blue" image="${image}" text="dark"}`,
        '',
        `::header[Размытое изображение]{bg="image" effect="blur" fill="blue" image="${image}"}`,
        '',
        `::header[Изображение и затемнение]{bg="image" effect="dim" fill="blue" image="${image}"}`,
        '',
        `::header[Изображение и градиент]{bg="image" effect="gradient" fill="blue" image="${image}"}`,
        '',
        '::header[Меш-градиент]{bg="mesh" fill="indigo" fill2="teal"}',
        '',
        '::header[Паттерн]{bg="pattern" fill="navy"}',
        '',
    ].join('\n'),

    fills: [
        '::header[Синий]{fill="blue"}',
        '',
        '::header[Индиго]{fill="indigo"}',
        '',
        '::header[Фиолетовый]{fill="purple"}',
        '',
        '::header[Бирюзовый]{fill="teal"}',
        '',
        '::header[Зелёный]{fill="green"}',
        '',
        '::header[Янтарный]{fill="amber"}',
        '',
        '::header[Красный]{fill="red"}',
        '',
        '::header[Тёмно-синий]{fill="navy"}',
        '',
    ].join('\n'),

    seeds: [
        '::header[Раскладка из макета]{fill="purple" seed="0"}',
        '',
        '::header[Другая раскладка]{fill="purple" seed="481203"}',
        '',
        '::header[И ещё одна]{bg="mesh" fill="indigo" fill2="red" seed="77"}',
        '',
    ].join('\n'),

    emptyImage: `::header[Слот под изображение]{bg="image" fill="teal"}\n`,

    insideCut: [
        '{% cut "Обложка внутри ката" %}',
        '',
        '::header[Портал команды Вики]{fill="green"}',
        '',
        '{% endcut %}',
        '',
    ].join('\n'),

    unknownValues: `::header[Неизвестные значения]{format="huge" bg="rainbow" fill="magenta"}\n`,
};
