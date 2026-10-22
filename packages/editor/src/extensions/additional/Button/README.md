# Button

Кнопка-ссылка отдельным блоком.

```md
::button[Открыть](https://example.com){view=outlined color=blue target=\_blank}
```

Подпись — в `[]`, адрес — в `()`. Адрес проверяется `md.validateLink`: запрещённый адрес заменяется пустой строкой.

| `view`            | Стиль          | `color`                                                        |
| ----------------- | -------------- | -------------------------------------------------------------- |
| `action` (умолч.) | Акцентные      | `default` (умолч.), `blue`, `green`, `yellow`, `red`, `violet` |
| `normal`          | Второстепенная | `gray`, `blue`, `green`, `yellow`, `red`, `violet`             |
| `outlined`        | С обводкой     | `gray`, `blue`, `green`, `yellow`, `red`, `violet`             |
| `flat`            | Без фона       | `default`, `gray`, `blue`, `green`, `yellow`, `red`, `violet`  |

Неизвестный вид заменяется на `action`, недоступный виду цвет — на первый цвет вида. `target=_blank` открывает ссылку в новой вкладке, другие значения `target` отбрасываются.

В визуальном редакторе клик по кнопке открывает настройки: текст, стиль с превью, ссылку и переключатель новой вкладки.

Команда `addButton` вставляет кнопку на место курсора и открывает её настройки. Для панелей инструментов и меню `/` расширение экспортирует пункты `buttonItemView`, `buttonItemWysiwyg` и `buttonItemMarkup`.

## Подключение

```ts
import {Button} from '@gravity-ui/markdown-editor/extensions/additional/Button/index.js';
import button from '@gravity-ui/markdown-editor/markdown-it/button';
import '@gravity-ui/markdown-editor/extensions/additional/Button/index.css';

builder.use(Button); // ВИЗИВИГ, стили подключаются вместе с расширением
md.use(button); // превью и просмотр, стили — импортом `index.css`
```
