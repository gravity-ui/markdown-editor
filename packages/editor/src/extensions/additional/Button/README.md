# Button

Кнопка-ссылка отдельным блоком.

```md
::button[Открыть](https://example.com)
```

Подпись — в `[]`, адрес — в `()`. Адрес проверяется `md.validateLink`: запрещённый адрес заменяется пустой строкой.

## Подключение

```ts
import {Button} from '@gravity-ui/markdown-editor/extensions/additional/Button/index.js';
import button from '@gravity-ui/markdown-editor/markdown-it/button';
import '@gravity-ui/markdown-editor/extensions/additional/Button/index.css';

builder.use(Button); // ВИЗИВИГ, стили подключаются вместе с расширением
md.use(button); // превью и просмотр, стили — импортом `index.css`
```
