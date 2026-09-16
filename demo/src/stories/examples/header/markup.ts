// Тот же файл, что раздаёт playwright, поэтому снимки не зависят от сети
const HERO = '/assets/header-cover.svg';
const PORTRAIT = '/assets/header-portrait.svg';

export const markup = {
    empty: `
:::header-block
:::

Кликните по блоку — сверху появится панель настроек.
`.trim(),

    filled: `
:::header-block
title: 'Добро пожаловать на портал'
description: 'Всё, что нужно команде, — на одной странице.'
actions:
  - type: 'button'
    title: 'Начать работу'
    href: '/start'
  - type: 'link'
    title: 'Смотреть разделы'
    href: '/sections'
:::

Обычный абзац под обложкой.
`.trim(),

    small: `
:::header-block {format=small fill=green}
title: 'Отпуска и справки'
description: 'Документы, заявки и сроки в одном месте.'
actions:
  - type: 'button'
    title: 'Оформить'
    href: '/vacation'
:::
`.trim(),

    bleed: `
:::header-block {edges=bleed fill=yellow}
title: 'Такси для сотрудников'
description: 'Корпоративный тариф и лимиты по подразделениям.'
:::
`.trim(),

    fills: `
:::header-block {format=small fill=grey}
title: 'Серый'
:::

:::header-block {format=small fill=blue}
title: 'Синий'
:::

:::header-block {format=small fill=green}
title: 'Зелёный'
:::

:::header-block {format=small fill=yellow}
title: 'Жёлтый'
:::

:::header-block {format=small fill=orange}
title: 'Оранжевый'
:::

:::header-block {format=small fill=red}
title: 'Красный'
:::

:::header-block {format=small fill=purple}
title: 'Фиолетовый'
:::

:::header-block {format=small fill=contrast}
title: 'Контрастный'
:::
`.trim(),

    borders: `
:::header-block {format=small border=none}
title: 'Без рамки'
:::

:::header-block {format=small border=solid}
title: 'Сплошная рамка'
:::

:::header-block {format=small fill=green border=dashed}
title: 'Черновик раздела'
description: 'Пунктирная рамка помечает страницу, которую ещё не опубликовали.'
:::

:::header-block {format=small border=dotted}
title: 'Точечная рамка'
:::
`.trim(),

    image: `
:::header-block {bg=image fill=purple image="${HERO}"}
title: 'HR-департамент'
description: 'Отпуска, справки, командировки и всё остальное.'
actions:
  - type: 'button'
    title: 'Открыть раздел'
    href: '/hr'
:::
`.trim(),

    imageDark: `
:::header-block {edges=bleed bg=image text=light image="${HERO}"}
title: 'Ночной эфир'
description: 'Светлая типографика поверх тёмной иллюстрации.'
:::
`.trim(),

    imageSplit: `
:::header-block {bg=image layout=split image="${PORTRAIT}"}
title: 'Онбординг'
description: 'Вертикальные и квадратные иллюстрации фоном обрезаются, поэтому им отдельная колонка.'
actions:
  - type: 'button'
    title: 'Пройти онбординг'
    href: '/onboarding'
:::
`.trim(),

    imageEmpty: `
:::header-block {bg=image}
title: 'Картинка ещё не загружена'
description: 'Пунктирный слот виден, пока атрибут image пуст.'
:::
`.trim(),

    nested: `
Обложка внутри ката — проверка делимитеров директивы.

{% cut "Развернуть" %}

:::header-block {format=small fill=red}
title: 'Обложка внутри ката'
:::

{% endcut %}
`.trim(),

    everything: `
:::header-block {format=small edges=bleed bg=image layout=split fill=contrast text=light image="${PORTRAIT}" border=dotted}
title: 'Все атрибуты сразу'
description: 'Крайний случай: каждый атрибут задан не дефолтным значением.'
actions:
  - type: 'button'
    title: 'Основная'
    href: '/a'
  - type: 'link'
    title: 'Ссылка'
    href: '/b'
:::
`.trim(),

    // Ломаное тело из чужого документа не должно ронять разбор страницы
    broken: `
:::header-block {fill=orange}
title: 'Заголовок есть'
actions: 'а вот это не список'
  отступ: [ломаный
:::

Абзац после блока с битым yaml.
`.trim(),
};
