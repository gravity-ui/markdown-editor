// Тот же файл, что раздаёт playwright, поэтому снимки не зависят от сети
const HERO = '/assets/header-cover.svg';
const PORTRAIT = '/assets/header-portrait.svg';

export const markup = {
    empty: `
:::header
:::

Кликните по блоку — сверху появится панель настроек.
`.trim(),

    filled: `
:::header [Добро пожаловать на портал]
Всё, что нужно команде, — на одной странице.

::action[Начать работу]{href="/start"}
::action[Смотреть разделы]{href="/sections" variant=link}
:::

Обычный абзац под обложкой.
`.trim(),

    small: `
:::header [Отпуска и справки] {format=small fill=green}
Документы, заявки и сроки в одном месте.

::action[Оформить]{href="/vacation"}
:::
`.trim(),

    bleed: `
:::header [Такси для сотрудников] {edges=bleed fill=yellow}
Корпоративный тариф и лимиты по подразделениям.
:::
`.trim(),

    fills: `
:::header [Серый] {format=small fill=grey}
:::

:::header [Синий] {format=small fill=blue}
:::

:::header [Зелёный] {format=small fill=green}
:::

:::header [Жёлтый] {format=small fill=yellow}
:::

:::header [Оранжевый] {format=small fill=orange}
:::

:::header [Красный] {format=small fill=red}
:::

:::header [Фиолетовый] {format=small fill=purple}
:::

:::header [Контрастный] {format=small fill=contrast}
:::
`.trim(),

    borders: `
:::header [Без рамки] {format=small border=none}
:::

:::header [Сплошная рамка] {format=small border=solid}
:::

:::header [Черновик раздела] {format=small border=dashed fill=green}
Пунктирная рамка помечает страницу, которую ещё не опубликовали.
:::

:::header [Точечная рамка] {format=small border=dotted}
:::
`.trim(),

    image: `
:::header [HR-департамент] {bg=image image="${HERO}" fill=purple}
Отпуска, справки, командировки и всё остальное.

::action[Открыть раздел]{href="/hr"}
:::
`.trim(),

    imageDark: `
:::header [Ночной эфир] {bg=image image="${HERO}" text=light edges=bleed}
Светлая типографика и тёмный скрим для тёмной иллюстрации.
:::
`.trim(),

    imageSplit: `
:::header [Онбординг] {bg=image layout=split image="${PORTRAIT}" fill=blue}
Вертикальные и квадратные иллюстрации фоном обрезаются, поэтому им отдельная колонка.

::action[Пройти онбординг]{href="/onboarding"}
:::
`.trim(),

    imageEmpty: `
:::header [Картинка ещё не загружена] {bg=image}
Пунктирный слот виден, пока атрибут image пуст.
:::
`.trim(),

    nested: `
Обложка внутри ката — проверка делимитеров директивы.

{% cut "Развернуть" %}

:::header [Обложка внутри ката] {format=small fill=red}
:::

{% endcut %}
`.trim(),

    everything: `
:::header [Все атрибуты сразу] {format=small edges=bleed bg=image layout=split fill=contrast text=light image="${PORTRAIT}" border=dotted}
Крайний случай: каждый атрибут задан не дефолтным значением.

::action[Основная]{href="/a"}
::action[Ссылка]{href="/b" variant=link}
:::
`.trim(),
};
