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
::header-title[Добро пожаловать на портал]
::header-description[Всё, что нужно команде, — на одной странице.]
::header-action[Начать работу] {href="/start"}
::header-action[Смотреть разделы] {href="/sections" type=link}
:::

Обычный абзац под обложкой.
`.trim(),

    small: `
:::header-block {format=small fill=green}
::header-title[Отпуска и справки]
::header-description[Документы, заявки и сроки в одном месте.]
::header-action[Оформить] {href="/vacation"}
:::
`.trim(),

    bleed: `
:::header-block {edges=bleed fill=yellow}
::header-title[Такси для сотрудников]
::header-description[Корпоративный тариф и лимиты по подразделениям.]
:::
`.trim(),

    fills: `
:::header-block {format=small fill=grey}
::header-title[Серый]
:::

:::header-block {format=small fill=blue}
::header-title[Синий]
:::

:::header-block {format=small fill=green}
::header-title[Зелёный]
:::

:::header-block {format=small fill=yellow}
::header-title[Жёлтый]
:::

:::header-block {format=small fill=orange}
::header-title[Оранжевый]
:::

:::header-block {format=small fill=red}
::header-title[Красный]
:::

:::header-block {format=small fill=purple}
::header-title[Фиолетовый]
:::

:::header-block {format=small fill=contrast}
::header-title[Контрастный]
:::
`.trim(),

    decor: `
:::header-block {fill=purple}
::header-title[Мягкие пятна]
::header-description[Узор на заливке включён по умолчанию.]
:::

:::header-block {fill=purple decor=none}
::header-title[Ровная заливка]
::header-description[Тот же цвет без узора.]
:::

:::header-block {format=small fill=contrast}
::header-title[Компактная на контрастной заливке]
:::
`.trim(),

    borders: `
:::header-block {format=small border=none}
::header-title[Без рамки]
:::

:::header-block {format=small border=solid}
::header-title[Сплошная рамка]
:::

:::header-block {format=small fill=green border=dashed}
::header-title[Черновик раздела]
::header-description[Пунктирная рамка помечает страницу, которую ещё не опубликовали.]
:::

:::header-block {format=small border=dotted}
::header-title[Точечная рамка]
:::
`.trim(),

    image: `
:::header-block {bg=image fill=purple image="${HERO}"}
::header-title[HR-департамент]
::header-description[Отпуска, справки, командировки и всё остальное.]
::header-action[Открыть раздел] {href="/hr"}
:::
`.trim(),

    imageDark: `
:::header-block {edges=bleed bg=image text=light image="${HERO}"}
::header-title[Ночной эфир]
::header-description[Светлая типографика поверх тёмной иллюстрации.]
:::
`.trim(),

    imageSplit: `
:::header-block {bg=image layout=split image="${PORTRAIT}"}
::header-title[Онбординг]
::header-description[Вертикальные и квадратные иллюстрации фоном обрезаются, поэтому им отдельная колонка.]
::header-action[Пройти онбординг] {href="/onboarding"}
:::
`.trim(),

    imageEmpty: `
:::header-block {bg=image}
::header-title[Картинка ещё не загружена]
::header-description[Пунктирный слот виден, пока атрибут image пуст.]
:::
`.trim(),

    nested: `
Обложка внутри ката — проверка делимитеров директивы.

{% cut "Развернуть" %}

:::header-block {format=small fill=red}
::header-title[Обложка внутри ката]
:::

{% endcut %}
`.trim(),

    // `decor` сюда не попадает: он осмыслен только при `bg=fill` и с картинкой не сериализуется
    everything: `
:::header-block {format=small edges=bleed bg=image layout=split fill=contrast text=light image="${PORTRAIT}" border=dotted}
::header-title[Все атрибуты сразу]
::header-description[Крайний случай: каждый атрибут задан не дефолтным значением.]
::header-action[Основная] {href="/a"}
::header-action[Ссылка] {href="/b" type=link}
:::
`.trim(),

    // Ломаное тело из чужого документа не должно ронять разбор страницы
    broken: `
:::header-block {fill=orange}
::header-title[Заголовок есть]
::unknown[Эта директива не поддерживается]
::header-action[Незакрытая скобка
:::

Абзац после блока с некорректной директивой.
`.trim(),
};
