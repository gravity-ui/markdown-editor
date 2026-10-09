# Header

Обложка страницы с заголовком, описанием, кнопками и настраиваемым фоном.
Текст не поддерживает форматирование. Панель позволяет добавить до двух кнопок или ссылок.
Пункт «Действия» объединяет добавление кнопок и ссылок, их адреса, вид и цвет.
Ручки слева меняют порядок действий перетаскиванием или стрелками на клавиатуре, сохраняя настройки и черновики адресов.
Enter или выход из попапа сохраняет адреса, Escape отменяет ввод.
В панели картинки доступны превью, замена файла, адрес и схемы расположения картинки.

## Markdown

```
:::header-block {fill=green}
::header-title[Добро пожаловать]
::header-description[Материалы команды]
::header-action[Начать работу] {href="/start" color=green}
:::
```

Оформление задаётся атрибутами контейнера `:::header-block`, содержимое — вложенными директивами `::header-title`, `::header-description` и `::header-action`.
Текст записывается в `[...]`, адрес, вид и цвет действия — в `{href="..." type=link color=green}`.
Парсер использует `@diplodoc/directive`. Скобки, обратные слеши и переносы в тексте экранируются при сохранении.
У действия есть атрибуты `href` и `type`: `button` (по умолчанию) или `link`.
Необязательный `color` задаёт цвет кнопки: `brand` (по умолчанию) или значение из палитры `fill`.
Цвет текста кнопки подбирается автоматически. У ссылки цвет не применяется, но сохраняется при смене вида.
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
| `decor`  | `blobs`, `none` (при `bg=fill`)                                          | `blobs`       |
| `text`   | `auto`, `light`, `dark`                                                  | `auto`        |
| `image`  | URL изображения                                                          | Пустая строка |
| `border` | `none`, `solid`, `dashed`, `dotted`                                      | `none`        |

## Ограничения

- В Markdown содержимое редактируется вручную; панель доступна в WYSIWYG.
- `bleed` убирает скругление; растягивание до краёв страницы задаёт хост.
- `text=auto` учитывает заливку и тему. Для фотографии цвет текста выбирается вручную.
- `decor=blobs` рисует мягкие пятна на заливке; их яркость подстраивается под заливку и тему.
  Уже 560px пятна не рисуются: справа от текста не остаётся места. Атрибут при этом сохраняется.
- Неизвестные ключи отбрасываются, недопустимые значения заменяются стандартными.
- Неизвестные и некорректные вложенные директивы игнорируются. Заголовок обложки не меняет заголовок страницы.
