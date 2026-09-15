// Тот же файл, что раздаёт playwright, поэтому снимки не зависят от сети
const HERO = '/assets/test-image.jpg';
const PORTRAIT = '/assets/test-image.jpg';

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
:::header [Отпуска и справки] {format=small fill=green-light}
Документы, заявки и сроки в одном месте.

::action[Оформить]{href="/vacation"}
:::
`.trim(),

    bleed: `
:::header [Такси для сотрудников] {edges=bleed fill=yellow-light}
Корпоративный тариф и лимиты по подразделениям.
:::
`.trim(),

    fills: `
:::header [Светло-синий] {format=small fill=blue-light}
:::

:::header [Светло-зелёный] {format=small fill=green-light}
:::

:::header [Светло-жёлтый] {format=small fill=yellow-light}
:::

:::header [Светло-красный] {format=small fill=red-light}
:::

:::header [Светло-фиолетовый] {format=small fill=purple-light}
:::

:::header [Серый] {format=small fill=grey}
:::

:::header [Синий] {format=small fill=blue}
:::

:::header [Тёмный] {format=small fill=dark}
:::
`.trim(),

    borders: `
:::header [Без рамки] {format=small border=none}
:::

:::header [Сплошная рамка] {format=small border=solid}
:::

:::header [Черновик раздела] {format=small border=dashed fill=green-light}
Пунктирная рамка помечает страницу, которую ещё не опубликовали.
:::

:::header [Точечная рамка] {format=small border=dotted}
:::
`.trim(),

    blobs: `
:::header [Курируемая раскладка] {seed=0}
Нулевой seed — раскладка, подобранная дизайнером.
:::

:::header [Сгенерированная раскладка] {seed=137 fill=purple-light}
Ненулевой seed разворачивается детерминированным PRNG, поэтому узор одинаков у всех.
:::

:::header [Без узоров] {blobs=false fill=yellow-light}
:::
`.trim(),

    image: `
:::header [HR-департамент] {bg=image image="${HERO}" fill=purple-light}
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
:::header [Онбординг] {bg=image layout=split image="${PORTRAIT}" fill=blue-light}
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

:::header [Обложка внутри ката] {format=small fill=red-light}
:::

{% endcut %}
`.trim(),

    everything: `
:::header [Все атрибуты сразу] {format=small edges=bleed bg=image layout=split fill=dark text=light image="${PORTRAIT}" border=dotted blobs=false seed=42}
Крайний случай: каждый атрибут задан не дефолтным значением.

::action[Основная]{href="/a"}
::action[Ссылка]{href="/b" variant=link}
:::
`.trim(),
};
