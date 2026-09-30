const image = 'https://storage.yandexcloud.net/gravity-ui/markdown-editor/header-cover.png';

/**
 * Декор и плитка ждут прозрачный файл без своей заливки: цвет даёт `fill`.
 * В демо такие файлы встроены как data-URI, чтобы стори не зависела от внешнего хранилища.
 */
const decor =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><circle cx='120' cy='120' r='108' fill='white' fill-opacity='0.22'/><circle cx='186' cy='64' r='44' fill='white' fill-opacity='0.4'/></svg>";

const tile =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='3.5' fill='white' fill-opacity='0.45'/></svg>";

export const markup = {
    empty: `::header[]{fill="blue"}\n`,

    formats: [
        '::header[Портал команды Вики]{fill="blue"}',
        '',
        '::header[Дежурства]{format="small" bg="fill" fill="navy"}',
        '',
    ].join('\n'),

    /** Сценарии фона из каталога: слой фона отдельно, изображение со слоем поверх отдельно. */
    backgrounds: [
        '# Слой фона',
        '',
        '::header[Сплошная заливка]{bg="fill" fill="yellow"}',
        '',
        '::header[Заливка с фигурами]{fill="blue"}',
        '',
        '::header[Градиент]{bg="gradient" fill="indigo" fill2="violet"}',
        '',
        '::header[Меш-градиент]{bg="mesh" fill="violet" fill2="sky"}',
        '',
        '::header[Паттерн]{bg="pattern" fill="sky"}',
        '',
        `::header[Декор из файла]{bg="fill" fill="sand" image="${decor}" layer="decor" fit="height" crop="right"}`,
        '',
        `::header[Плитка из файла]{bg="fill" fill="sky" image="${tile}" layer="tile" step="28"}`,
        '',
        '# Изображение и слой поверх него',
        '',
        `::header[Фотография]{fill="blue" image="${image}" text="dark"}`,
        '',
        `::header[Размытие]{fill="blue" effect="blur" image="${image}"}`,
        '',
        `::header[Затемнение]{fill="blue" effect="dim" image="${image}"}`,
        '',
        `::header[Цвет слева, фото справа]{fill="sand" effect="gradient" image="${image}"}`,
        '',
    ].join('\n'),

    /** Угол градиента и шаг плитки — числовые свойства основы. */
    angles: [
        '::header[Угол по умолчанию]{bg="gradient" fill="indigo" fill2="violet"}',
        '',
        '::header[Угол 90°]{bg="gradient" fill="indigo" fill2="violet" angle="90"}',
        '',
        '::header[Угол 270°]{bg="gradient" fill="indigo" fill2="violet" angle="270"}',
        '',
        '::header[Шаг 12 px]{bg="pattern" fill="sky" step="12"}',
        '',
        '::header[Шаг 64 px]{bg="pattern" fill="sky" step="64"}',
        '',
    ].join('\n'),

    /** Слой файла: на всю площадь, отдельным объектом поверх заливки, плиткой. */
    layers: [
        `::header[На всю площадь]{fill="blue" image="${image}" text="dark"}`,
        '',
        `::header[Отдельный объект]{bg="fill" fill="sand" image="${decor}" layer="decor" fit="height" crop="right"}`,
        '',
        `::header[Отдельный объект поверх фигур]{fill="violet" image="${decor}" layer="decor" fit="contain" crop="left"}`,
        '',
        `::header[Плиткой, шаг 24 px]{bg="fill" fill="sky" image="${tile}" layer="tile" step="24"}`,
        '',
        `::header[Плиткой, шаг 48 px]{bg="fill" fill="teal" image="${tile}" layer="tile" step="48"}`,
        '',
    ].join('\n'),

    /** Масштаб и положение кадра: четыре значения `fit` и девять положений `crop`. */
    crops: [
        '# Масштаб кадра',
        '',
        `::header[Заполнить]{fill="navy" image="${image}" text="light"}`,
        '',
        `::header[Вписать]{fill="navy" image="${image}" fit="contain" text="light"}`,
        '',
        `::header[По ширине]{fill="navy" image="${image}" fit="width" text="light"}`,
        '',
        `::header[По высоте]{fill="navy" image="${image}" fit="height" text="light"}`,
        '',
        '# Положение кадра',
        '',
        `::header[Сверху слева]{fill="navy" image="${image}" fit="contain" crop="top-left" text="light"}`,
        '',
        `::header[Справа]{fill="navy" image="${image}" fit="height" crop="right" text="light"}`,
        '',
        `::header[Снизу справа]{fill="navy" image="${image}" fit="contain" crop="bottom-right" text="light"}`,
        '',
    ].join('\n'),

    fills: [
        '::header[Синий]{bg="fill" fill="blue"}',
        '',
        '::header[Индиго]{bg="fill" fill="indigo"}',
        '',
        '::header[Фиолетовый]{bg="fill" fill="purple"}',
        '',
        '::header[Сиреневый]{bg="fill" fill="violet"}',
        '',
        '::header[Бирюзовый]{bg="fill" fill="teal"}',
        '',
        '::header[Зелёный]{bg="fill" fill="green"}',
        '',
        '::header[Небесный]{bg="fill" fill="sky"}',
        '',
        '::header[Янтарный]{bg="fill" fill="amber"}',
        '',
        '::header[Жёлтый]{bg="fill" fill="yellow"}',
        '',
        '::header[Песочный]{bg="fill" fill="sand"}',
        '',
        '::header[Красный]{bg="fill" fill="red"}',
        '',
        '::header[Тёмно-синий]{bg="fill" fill="navy"}',
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
