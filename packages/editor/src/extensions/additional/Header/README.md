# Header

Обложка страницы с заголовком, описанием, кнопками и настраиваемым фоном.
Текст не поддерживает форматирование. Панель позволяет добавить до двух кнопок.

## Markdown

```
:::header-block {fill=green}
title: 'Добро пожаловать'
description: 'Материалы команды'
actions:
  - type: 'button'
    title: 'Начать работу'
    href: '/start'
:::
```

Оформление задаётся атрибутами директивы, содержимое — YAML в её теле.
У действия есть строковые `title`, `href` и `type`: `button` или `link`.
Пустые поля опускаются при сохранении.

## Подключение

Расширение подключается отдельно и не входит в пресеты.

```ts
import {useMarkdownEditor, wysiwygToolbarConfigs} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {wHeaderItemData} from '@gravity-ui/markdown-editor/extensions/additional/Header/toolbar.js';

useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => builder.use(Header, {fileUploadHandler}),
    extensionOptions: {
      commandMenu: {actions: wysiwygToolbarConfigs.wCommandMenuConfig.concat(wHeaderItemData)},
    },
  },
});
```

`fileUploadHandler` загружает файл и возвращает `Promise<{url: string}>`.
Без обработчика URL изображения можно задать в панели или Markdown. Опция `headerKey` задаёт хоткей вставки.

## Атрибуты

| Ключ     | Значения                                                                 | По умолчанию  |
| -------- | ------------------------------------------------------------------------ | ------------- |
| `format` | `large`, `small`                                                         | `large`       |
| `edges`  | `rounded`, `bleed`                                                       | `rounded`     |
| `bg`     | `fill`, `image`                                                          | `fill`        |
| `layout` | `cover`, `split` (при `bg=image`)                                        | `cover`       |
| `fill`   | `grey`, `blue`, `green`, `yellow`, `orange`, `red`, `purple`, `contrast` | `blue`        |
| `text`   | `auto`, `light`, `dark`                                                  | `auto`        |
| `image`  | URL изображения                                                          | Пустая строка |
| `border` | `none`, `solid`, `dashed`, `dotted`                                      | `none`        |

## Ограничения

- В Markdown содержимое редактируется вручную; панель доступна в WYSIWYG.
- `bleed` убирает скругление; растягивание до краёв страницы задаёт хост.
- `text=auto` учитывает заливку и тему. Для фотографии цвет текста выбирается вручную.
- Неизвестные ключи отбрасываются, недопустимые значения заменяются стандартными.
- Некорректный YAML даёт пустой блок. Заголовок обложки не меняет заголовок страницы.
