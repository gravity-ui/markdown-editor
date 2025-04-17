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
- [Как подключить редактор в Create React App](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-create-react-app--docs)
- [Как добавить предварительный просмотр для режима разметки](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-preview--docs)
- [Как добавить расширение HTML](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-html-block--docs)
- [Как добавить расширение Latex](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-latex-extension--docs)
- [Как добавить расширение Mermaid](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-mermaid-extension--docs)
- [Как создать собственное расширение](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-creation--docs)
- [Как добавить расширение GPT](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-gpt--docs)
- [Как добавить расширение привязки текста в Markdown](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-with-popup--docs)


### Разработка

Для запуска Storybook в режиме разработки выполните следующую команду:

```shell
npm start
```

### i18n

Для настройки интернационализации используйте `configure`:

```typescript
import {configure} from '@gravity-ui/markdown-editor';

configure({
  lang: 'ru',
});
```

Обязательно сделайте вызов `configure()` из [UIKit](https://github.com/gravity-ui/uikit?tab=readme-ov-file#i18n) и других UI-библиотек.

### Система z-index

В этом проекте используется система z-index для управления слоями элементов. Ниже приведены определенные уровни и их значения:

| level               | z-index value |
| ------------------- | ------------- |
| background          | -1            |
| default             | 0             |
| forefront           | 1             |
| img-settings-button | 2             |
| table-view-button   | 100           |
| table-cell-button   | 110           |
| sticky-toolbar      | 990           |

### Использование

Для применения z-index в компонентах используйте миксин z-index, передавая соответствующий ключ в качестве аргумента:

```scss
@use 'styles/mixins.scss';

.tooltip {
  @include mixins.z-index('forefront');
}
```

### Участие в разработке

- [Информация для контрибьюетров](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-contributing--docs)
