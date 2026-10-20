![Markdown Editor](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46)

# @gravity-ui/markdown-editor &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-editor)](https://www.npmjs.com/package/@gravity-ui/markdown-editor) [![CI](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/ci.yml?branch=main&label=CI)](https://github.com/gravity-ui/markdown-editor/actions/workflows/ci.yml?query=branch:main) [![Release](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/release.yml?branch=main&label=Release)](https://github.com/gravity-ui/markdown-editor/actions/workflows/release.yml?query=branch:main) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685)](https://preview.gravity-ui.com/md-editor/)

## Редактор Markdown с поддержкой режимов WYSIWYG и Markup

`MarkdownEditor` — эффективный инструмент для работы с Markdown, сочетающий режимы WYSIWYG и Markup. Он позволяет создавать и редактировать контент в удобном визуальном режиме с полным контролем над разметкой.

### 🔧 Основные характеристики

- Поддержка базового синтаксиса Markdown и [YFM](https://ydocs.tech).
- Расширяемость за счет использования движков ProseMirror и CodeMirror.
- Возможность работы в режимах WYSIWYG и Markup для максимальной гибкости.

## Установка

```shell
npm install @gravity-ui/markdown-editor
```

### Необходимые зависимости

Для начала работы с пакетом в проекте необходимо предварительно установить следующие зависимости: `@diplodoc/transform`, `react`, `react-dom` и др. Подробную информацию можно найти в разделе `peerDependencies` файла `package.json`.

## Начало работы

`MarkdownEditor` поставляется в виде React-хука для создания экземпляра редактора и компонента для рендеринга представления.
Для настройки стиля и темы см. [документацию UIKit](https://github.com/gravity-ui/uikit?tab=readme-ov-file#styles).

```tsx
import React from 'react';
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';

function Editor({onSubmit}) {
  const editor = useMarkdownEditor({allowHTML: false});

  React.useEffect(() => {
    function submitHandler() {
      // Serialize current content to markdown markup
      const value = editor.getValue();
      onSubmit(value);
    }

    editor.on('submit', submitHandler);
    return () => {
      editor.off('submit', submitHandler);
    };
  }, [onSubmit]);

  return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
}
```

Полезные ссылки:
- [Как подключить редактор в Create React App](https://gravity-ui.github.io/markdown-editor/getting-started/create-react-app.html)
- [Как добавить предварительный просмотр для режима разметки](https://gravity-ui.github.io/markdown-editor/getting-started/preview.html)
- [Как добавить расширение HTML](https://gravity-ui.github.io/markdown-editor/extensions/html-block.html)
- [Как добавить расширение Latex](https://gravity-ui.github.io/markdown-editor/extensions/latex-extension.html)
- [Как добавить расширение Mermaid](https://gravity-ui.github.io/markdown-editor/extensions/mermaid-extension.html)
- [Как создать собственное расширение](https://gravity-ui.github.io/markdown-editor/develop/extension-creation.html)
- [Как добавить расширение GPT](https://gravity-ui.github.io/markdown-editor/extensions/gpt.html)
- [Как добавить расширение привязки текста в Markdown](https://gravity-ui.github.io/markdown-editor/develop/extension-with-popup.html)
- [Как подключить стили редактора в теневом дереве](https://gravity-ui.github.io/markdown-editor/getting-started/shadow-dom-styles.html)


### Разработка

1. Установите оркжуение Nodejs, нужная версия указано в файле `.nvmrc`. Мы рекомендуем использовать [NVM](https://github.com/nvm-sh/nvm) или похожий инструмент.
2. Установите [pnpm](https://pnpm.io/installation), нужная версия указана в файле `package.json` в поле "packageManager".
3. Установите зависимости: `pnpm i`
4. Запустите дев-сервер Storybook: `pnpm start`

### i18n

Для настройки интернационализации используйте `configure`:

```typescript
import {configure} from '@gravity-ui/markdown-editor';

configure({
  lang: 'ru',
});
```

Обязательно сделайте вызов `configure()` из [UIKit](https://github.com/gravity-ui/uikit?tab=readme-ov-file#i18n) и других UI-библиотек.


### Участие в разработке

- [Информация для контрибьюетров](https://gravity-ui.github.io/markdown-editor/contributing.html)
