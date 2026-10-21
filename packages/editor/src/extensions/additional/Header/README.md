# Header

Обложка страницы: блок на всю ширину колонки с одной из трёх высот.

```md
:::header{height=s}

:::
```

| Параметр | Значения                                 | По умолчанию |
| -------- | ---------------------------------------- | ------------ |
| `height` | `s` (236 px), `m` (260 px), `l` (300 px) | `s`          |

Содержимое между строками `:::` отбрасывается.

## Подключение

```ts
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {headerDirective} from '@gravity-ui/markdown-editor/extensions/additional/Header/HeaderSpecs/index.js';

builder.use(Header); // ВИЗИВИГ
md.use(headerDirective); // превью
```
