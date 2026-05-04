# Sticky-header в редакторе: спецификация текущей реализации

## О чем этот документ

Этот документ фиксирует текущее устройство sticky-header в редакторе. Он описывает состав механизма, поведение во время работы, контракты, неизменные правила, константы и ограничения реализации.

Документ ограничен описанием текущей реализации.

## Содержание

- [О чем этот документ](#о-чем-этот-документ)
- [Часть 1. Контекст](#часть-1-контекст)
  - [Термины](#термины)
  - [Условия работы](#условия-работы)
- [Часть 2. Устройство](#часть-2-устройство)
  - [Состав sticky-header](#состав-sticky-header)
  - [Как работает sticky-header](#как-работает-sticky-header)
  - [Константы и фиксированные значения](#константы-и-фиксированные-значения)
- [Часть 3. Контракты и правила](#часть-3-контракты-и-правила)
  - [Внешний контракт](#внешний-контракт)
  - [DOM-контракт](#dom-контракт)
  - [CSS-контракт](#css-контракт)
  - [Неизменные правила](#неизменные-правила)
  - [Поведенческие особенности](#поведенческие-особенности)
  - [Ограничения](#ограничения)
- [Часть 4. Диагностика](#часть-4-диагностика)
  - [Контрольные сценарии](#контрольные-сценарии)
  - [Типовые сбои и куда смотреть](#типовые-сбои-и-куда-смотреть)
- [Краткое резюме](#краткое-резюме)

## Часть 1. Контекст

### Термины

- `sticky-header` — набор связанных механизмов, которые удерживают toolbar/settings у верхней границы, помогают popup и menu-компонентам открываться поверх sticky-toolbar и добавляют верхний отступ при программном scroll, чтобы контент не скрывался под toolbar.
- `sticky-container` — DOM-элемент с классом `.g-md-editor-sticky`, который служит базовым контейнером для sticky-состояний.
- `sticky-active` — состояние, в котором элемент уже находится в sticky-положении и для него применены active-стили.
- `popup-layer` — всплывающие меню и popup-компоненты тулбара и settings, которые должны отображаться поверх sticky-toolbar.
- `scroll offset` — дополнительное верхнее смещение, которое учитывается при программном scroll к строке.

### Условия работы

- Текущая реализация определяет `sticky-active` по событиям, наблюдаемым на уровне `window`, и по сравнению viewport-координаты элемента с computed CSS `top`; во внутренних scroll-контейнерах эта схема может работать некорректно.
- В текущей встроенной реализации `useSticky` работает с элементами, которым модификатор `_sticky` задает `position: sticky` и числовой `top`. Без `_sticky` у встроенных sticky-элементов `top` остается `auto`, поэтому `sticky-active` не включается.
- Чтобы popup и menu-компоненты могли отображаться поверх sticky-toolbar, sticky-toolbar должен сохранять DOM-маркер `data-layout="sticky-toolbar"`.

## Часть 2. Устройство

### Состав sticky-header

| Часть | Где задается | Что делает | От чего зависит | Что не делает |
| --- | --- | --- | --- | --- |
| CSS sticky через `position: sticky` | `packages/editor/src/bundle/sticky/sticky.scss` | Фиксирует sticky-позиционирование, верхний offset, декоративный фон, рамку и базовый слой sticky-состояния | BEM-модификаторы `.g-md-editor-sticky`, CSS variables, поведение `position: sticky` в браузере и layout родительского контейнера | Не вычисляет `sticky-active`, не синхронизирует popup `z-index`, не участвует в программном scroll |
| `useSticky` | `packages/editor/src/react-utils/useSticky.ts` | Возвращает `true`, когда элемент фактически находится в sticky-положении | `ref` на DOM-элемент, вычисленный CSS `top`, события reflow на `window` | Не включает `position: sticky`, не выбирает scroll-контейнер, не меняет `z-index` |
| `useTargetZIndex` | `packages/editor/src/react-utils/useTargetZIndex.ts` | Читает `z-index` элемента с нужным `data-layout` и возвращает `targetZIndex + offset` | DOM-marker `data-layout="sticky-toolbar"`, валидный `z-index`, события reflow на `window` | Не создает слой сам, не гарантирует существование target-элемента |
| `getTopOffset` | `packages/editor/src/bundle/Editor.ts` | Вычисляет верхний offset для программного scroll с учетом sticky-toolbar | `--g-md-toolbar-sticky-offset`, константы `36px`, `8px`, `8px` | Не влияет на визуальное sticky-позиционирование и не участвует в `sticky-active` |

### Как работает sticky-header

#### 1. CSS-прилипание

Sticky-container строится на BEM-блоке `.g-md-editor-sticky`. Модификатор `_sticky` включает `position: sticky` и задает верхнюю точку прилипания:

```scss
top: calc(var(--g-md-toolbar-sticky-offset, 0px) + 8px);
```

Источник истины для этой части: [`sticky.scss`](../packages/editor/src/bundle/sticky/sticky.scss).

Здесь `+ 8px` — фиксированный верхний зазор между верхней границей и sticky-toolbar. Этот же зазор описан ниже в разделе `Константы и фиксированные значения`: в CSS это `+8px`, а в JS — `TOOLBAR_TOP_ADDITIONAL_OFFSET = 8`.

#### 2. Определение sticky-active

`useSticky` не вычисляет расстояние до точки прилипания. Хук проверяет только текущий факт: элемент уже прилип к верхнему отступу или еще нет.

```ts
const rectTop = elem.getBoundingClientRect().top;
const stickyTop = parseInt(getComputedStyle(elem).top, 10);
const stickyActive = rectTop <= stickyTop;
```

Хук подписывается на reflow-события `window` в фазе перехвата, переоткладывает наблюдение через `requestAnimationFrame` и обновляет React state только при смене значения.

Источник истины для этой части: [`useSticky.ts`](../packages/editor/src/react-utils/useSticky.ts).

#### 3. Синхронизация popup z-index

`useTargetZIndex` читает вычисленный `z-index` у DOM-элемента с `data-layout="sticky-toolbar"` и возвращает `targetZIndex + offset`. Если target-элемент не найден, `z-index` нечисловой или `<= 0`, хук возвращает `undefined`.

Эта логика используется popup и menu-компонентами toolbar и settings, поэтому они берут `z-index` у фактического DOM-элемента sticky-toolbar, а не у отдельной JS-константы.

Источник истины для этой части: [`useTargetZIndex.ts`](../packages/editor/src/react-utils/useTargetZIndex.ts).

#### 4. Компенсация верхнего отступа при программном scroll

`getTopOffset()` рассчитывает верхнее смещение для программного scroll по формуле:

```text
(--g-md-toolbar-sticky-offset + 8px) + 36px + 8px
```

Функция читает `--g-md-toolbar-sticky-offset`, вычисляет его числовое значение через временный скрытый `div` и добавляет три фиксированных компонента:

- дополнительный верхний offset `8px`;
- высоту toolbar `36px`;
- нижний зазор `8px`.

Эта логика используется в программном scroll и для markup mode, и для wysiwyg mode. Компенсация верхнего отступа при программном scroll работает отдельно от определения `sticky-active`: `getTopOffset()` не читает `sticky-active` и не зависит от результата `useSticky`.

Источник истины для этой части: [`Editor.ts`](../packages/editor/src/bundle/Editor.ts).

### Константы и фиксированные значения

| Значение | Где используется | Назначение | Связь с другими значениями |
| --- | --- | --- | --- |
| `$sticky-toolbar = 2000` | `packages/editor/src/styles/_zindex.scss` | Базовый `z-index` sticky-toolbar в active-состоянии | Становится базой для popup-слоя |
| `offset = 10` | `useTargetZIndex` default | Поднимает popup-слой над sticky-toolbar | Вместе с `2000` дает popup `z-index = 2010` |
| `+8px` в `top: calc(... + 8px)` | `sticky.scss` | Добавляет верхний визуальный зазор до sticky-точки | Соответствует `TOOLBAR_TOP_ADDITIONAL_OFFSET = 8` в JS |
| `TOOLBAR_TOP_ADDITIONAL_OFFSET = 8` | `Editor.ts` | Добавляет тот же верхний зазор в программном scroll | Соответствует `+8px` в `sticky.scss` |
| `TOOLBAR_HEIGHT = 36` | `Editor.ts` | Учитывает высоту toolbar при программном scroll | Входит в итоговую формулу `getTopOffset()` |
| `TOOLBAR_BOTTOM_OFFSET = 8` | `Editor.ts` | Учитывает зазор под toolbar при программном scroll | Входит в итоговую формулу `getTopOffset()` |
| `border-radius: 4px` | `sticky.scss` | Задает радиус `::before` в active-состоянии | Применяется вместе с active-рамкой и active-фоном |
| `inset: -4px` | `sticky.scss` | Задает fallback для `--g-md-toolbar-sticky-inset` | Используется как default для `::before`, если CSS variable не задана |

Связанные пары значений:

- `+8px` в CSS и `TOOLBAR_TOP_ADDITIONAL_OFFSET = 8` в JS описывают один и тот же верхний зазор.
- `z-index: 2000` для sticky-toolbar и default offset `10` в `useTargetZIndex` вместе образуют popup-слой `2010`.

## Часть 3. Контракты и правила

### Внешний контракт

#### Props

- `MarkdownEditorViewProps.stickyToolbar` — верхнеуровневый prop, который включает sticky-поведение toolbar и участвует в включении `sticky-active` для settings.
- На уровне `MarkdownEditorView` prop обязателен и не имеет default-значения.
- На уровне `MarkupEditorView` и `WysiwygEditorView` prop опционален и имеет default `true`.

#### CSS variables

Документированные значения по умолчанию берутся из [`docs/how-to-customize-the-editor.md`](./how-to-customize-the-editor.md).

| Переменная | Роль | Документированное значение по умолчанию | Фактический fallback/поведение |
| --- | --- | --- | --- |
| `--g-md-toolbar-sticky-offset` | Верхнее смещение sticky-элемента | `0px` | В CSS используется fallback `0px`; в `getTopOffset()` читается текущее значение custom property и отдельно вычисляется как число |
| `--g-md-toolbar-sticky-padding` | Padding sticky-container в active-состоянии | `-4px` | В `sticky.scss` fallback отсутствует; модуль не подставляет значение сам |
| `--g-md-toolbar-sticky-inset` | `inset` для `::before` в active-состоянии | `-4px` | В CSS используется fallback `-4px` |
| `--g-md-toolbar-sticky-border` | Рамка sticky-состояния | `1px solid var(--g-color-line-generic-solid)` | В CSS используется fallback `1px solid var(--g-color-line-generic-solid)` |
| `--g-md-toolbar-padding` | Базовый padding toolbar вне sticky-состояния | `0px` | Sticky-логика не читает значение напрямую; переменная влияет на общий layout toolbar |
| `--g-md-editor-padding` | Padding содержимого редактора | `0px` | Sticky-логика не управляет переменной напрямую; она влияет на визуальное совмещение toolbar и контента |

#### Экспортируемые низкоуровневые API

| API | Сигнатура | Что гарантирует | Что не делает |
| --- | --- | --- | --- |
| `useSticky<T>(ref)` | `(ref: React.RefObject<T>) => boolean` | Возвращает `true`, если элемент находится в sticky-положении (`rect.top <= computed top`) | Не включает `position: sticky`, не умеет выбирать scroll-контейнер, не выдает callback |
| `useTargetZIndex(selector, offset?)` | `(selector: string, offset?: number) => number \| undefined` | Возвращает `z-index` элемента с соответствующим `data-layout` плюс `offset` | Не создает слой сам, не гарантирует существование target-элемента |

### DOM-контракт

- Sticky-toolbar помечается `data-layout="sticky-toolbar"`.
- Этот DOM-маркер выступает источником истины для popup и menu-компонентов, которые должны отображаться поверх sticky-toolbar.
- `useTargetZIndex(LAYOUT.STICKY_TOOLBAR)` читает `z-index` именно с этого DOM-узла.
- От этого marker зависят popup list-button, popup menu в toolbar и settings popup.
- Если DOM-маркер отсутствует, popup и menu-компоненты не получают вычислимый `z-index` относительно toolbar и работают без этого источника слоя.

### CSS-контракт

Sticky-container задается блоком `.g-md-editor-sticky`. Базовый блок использует `display: grid`, `grid-template-columns: 1fr auto` и `grid-template-rows: 1fr`.

- `_sticky` включает sticky-позиционирование элемента: задает `position: sticky` и `top: calc(var(--g-md-toolbar-sticky-offset, 0px) + 8px)`.
- `_sticky-active` включает active-состояние sticky-элемента, если у элемента нет модификатора `_clear`: задает `z-index`, `padding` и создает псевдоэлемент `::before` с `inset`, `border`, `border-radius` и `background-color`.
- `_part_left` задает геометрию левой части составного sticky-блока: для `::before` устанавливает `right: 0`, убирает правую границу и правые радиусы.
- `_part_right` задает геометрию правой части составного sticky-блока: для `::before` устанавливает `left: 0`, убирает левую границу и левые радиусы.
- `_clear` исключает элемент из active-оформления: для него не применяются селекторы `_sticky-active`, `_part_left` и `_part_right`, завязанные на `:not(.g-md-editor-sticky_clear)`.

Модификаторы `_part_left` и `_part_right` не создают `::before` сами по себе. Они меняют геометрию уже существующего псевдоэлемента, поэтому их визуальный эффект проявляется вместе с active-состоянием.

Фон, рамка, `inset` и `border-radius` относятся к `::before`, а не к содержимому toolbar.

Источник истины для этого контракта: [`sticky.scss`](../packages/editor/src/bundle/sticky/sticky.scss).

### Неизменные правила

1. В текущей встроенной реализации `useSticky` работает с элементами, которым модификатор `_sticky` задает `position: sticky` и числовой `top`. Без `_sticky` у встроенных sticky-элементов `top` остается `auto`, поэтому `sticky-active` не включается.
2. Если sticky-toolbar не имеет DOM-маркера `data-layout="sticky-toolbar"`, popup и menu-компоненты не имеют вычислимого `z-index` относительно toolbar.
3. Если sticky-toolbar имеет числовой `z-index`, popup и menu-компоненты получают `targetZIndex + offset`; при default-значениях это `2010`.
4. Если `stickyToolbar === false`, toolbar не переходит в активное sticky-состояние; settings сохраняет `sticky`, но не получает активное sticky-состояние.
5. Если вызывается `getTopOffset()`, результат зависит от CSS variable и констант, а не от текущего `sticky-active`.
6. Если элемент находится во внутреннем scroll-контейнере, схема с наблюдением через события `window` и сравнением viewport-координаты элемента с computed CSS `top` может определять `sticky-active` некорректно.

### Поведенческие особенности

- `ToolbarView` включает sticky только при `stickyToolbar === true`; `sticky-active` для toolbar определяется как `useSticky(wrapperRef) && stickyToolbar`.
- `Settings` всегда получает `sticky: true`, но `sticky-active` для settings включается только при `useSticky(wrapperRef) && toolbarVisibility && stickyToolbar`.
- При `stickyToolbar={false}` settings сохраняет sticky-позиционирование, но не переходит в активное sticky-состояние.
- JS не включает sticky-поведение сам. Sticky-состояние сначала вычисляет CSS, а `useSticky` синхронизируется с уже вычисленным результатом.
- Popup `z-index` вычисляется от фактического DOM-элемента sticky-toolbar, а не от отдельной JS-константы слоя.

### Ограничения

1. `useSticky` и `useTargetZIndex` слушают только события `window`.
2. Scroll внутри `overflow: auto` container может некорректно обновлять `sticky-active` и пересчет popup `z-index` (см. [Контрольные сценарии](#контрольные-сценарии)).
3. `useEffectOnce` в обоих хуках фиксирует listeners на `window` на весь lifecycle mount.
4. `parseInt(getComputedStyle(elem).top, 10)` возвращает `NaN`, если `top: auto`; в этом случае `useSticky` остается `false`.
5. `useTargetZIndex` хранит локальную копию event list, а не использует `REFLOW_EVENTS`.
6. Для `--g-md-toolbar-sticky-padding` нет CSS fallback, хотя документированное default-значение существует.
7. Контракт `stickyToolbar` несимметричен: на верхнем уровне prop обязателен, во внутренних view он опционален и имеет default `true`.

## Часть 4. Диагностика

### Контрольные сценарии

| Сценарий | CSS sticky | sticky-active | popup z-index | programmatic scroll |
| --- | --- | --- | --- | --- |
| Обычный scroll через `window` | Работает от viewport при наличии `_sticky` | Переключается в точке прилипания | В текущей встроенной реализации вычисляется от `z-index` sticky-toolbar в активном sticky-состоянии; вне активного sticky-состояния обычно остается `undefined` | Использует `getTopOffset()` независимо от sticky-состояния |
| `stickyToolbar={false}` | У toolbar `_sticky` нет; у settings `sticky` остается | Для toolbar `false`; для settings активное sticky-состояние тоже `false` | В текущей встроенной реализации обычно `undefined`, потому что у toolbar нет положительного `z-index` | Компенсация scroll остается включенной |
| Toolbar еще не дошел до sticky-точки | `_sticky` включен, но sticky-точка еще не достигнута | `false` | `undefined` | Компенсация scroll доступна независимо |
| Active sticky-toolbar с popup | `_sticky` включен и элемент находится в sticky-точке | `true` | По умолчанию `2010` (`2000 + 10`) | Компенсация scroll доступна независимо |
| Отсутствует `data-layout="sticky-toolbar"` | Визуальное sticky может работать | От marker не зависит напрямую | `undefined` | От marker не зависит |
| Родитель с `overflow: auto` | CSS sticky может работать относительно контейнера | Может определяться некорректно из-за наблюдения через события `window` и сравнения viewport-координаты с computed CSS `top` | Не пересчитывается надежно | Поведение с учетом scroll-контейнера не гарантировано |
| `top: auto` | Вычислимой sticky-точки нет | `false` из-за `NaN` | Обычно `undefined`, так как активное sticky-состояние не включается | Напрямую от computed `top` не зависит |

### Типовые сбои и куда смотреть

| Симптом | Подсистема | Что проверить в спецификации |
| --- | --- | --- |
| Popup уходит под sticky-toolbar | Popup и menu-компоненты | `DOM-контракт`, `Как работает sticky-header` / `3. Синхронизация popup z-index`, `Константы и фиксированные значения` |
| Toolbar липнет, но активное sticky-состояние не включается | Определение `sticky-active` | `Условия работы`, `Как работает sticky-header` / `2. Определение sticky-active`, `Неизменные правила`, `Ограничения` |
| `moveToLine` прячет строку под header | Компенсация верхнего отступа при программном scroll | `Как работает sticky-header` / `4. Компенсация верхнего отступа при программном scroll`, `Внешний контракт` / `CSS variables`, `Константы и фиксированные значения` |
| Поведение ломается внутри `overflow: auto` или Popup | Условия работы и наблюдение через события `window` | `Условия работы`, `Ограничения`, `Контрольные сценарии` |
| Settings остается sticky, но не становится active | Асимметрия toolbar/settings | `CSS-контракт`, `Поведенческие особенности`, `Неизменные правила` |

## Краткое резюме

Текущий sticky-header состоит из четырех связанных частей: CSS sticky-позиционирования, JS-определения `sticky-active`, синхронизации слоя popup и menu-компонентов и JS-компенсации верхнего отступа при программном scroll. Эти части реализованы в разных модулях, но в рантайме образуют один механизм.

`sticky-active` определяется по уже вычисленному CSS-состоянию, popup и menu-компоненты опираются на фактический DOM-элемент sticky-toolbar, а программный scroll отдельно компенсирует верхнее пространство через `getTopOffset()`.
