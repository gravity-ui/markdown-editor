# Header

Обложка страницы: блок на всю ширину колонки с одной из трёх высот.

```md
:::header{height=s}

:::
```

| Параметр | Значения                                 | По умолчанию |
| -------- | ---------------------------------------- | ------------ |
| `height` | `s` (236 px), `m` (300 px), `l` (360 px) | `s`          |

Содержимое между строками `:::` отбрасывается.

## Подключение

```ts
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import header from '@gravity-ui/markdown-editor/markdown-it/header';
import '@gravity-ui/markdown-editor/extensions/additional/Header/index.css';

builder.use(Header); // ВИЗИВИГ, стили подключаются вместе с расширением
md.use(header); // превью и просмотр, стили — импортом `index.css`
```
