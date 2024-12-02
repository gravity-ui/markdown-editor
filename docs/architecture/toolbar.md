# 1. Introduction to the Concept of Modules

## Why Are Modules Necessary?

During the development and use of **MarkdownEditor**, there is ambiguity in terminology. The term "extension" can refer to:
- Add-ons for the WYSIWYG editor (based on **ProseMirror**),
- Add-ons for the Markdown markup editor module (based on **CodeMirror**),
- Plugins for Markdown formatting (YFM),
- Elements of the **MarkdownEditor** interface,
- Or something else entirely.

This ambiguity complicates support and development, increases code coupling, and makes scalability more difficult.

To address these issues, I propose the concept of **modules** — components that belong to the program's interface and represent its shared elements. Modules will help differentiate between internal mechanisms (ProseMirror, CodeMirror) and interface elements, providing a clearer architecture and simplifying design, implementation, and maintenance.

### Differentiating the Term "Editor":

- **MarkdownEditor** — the main program that integrates modules, extensions, and plugins. It is a unified platform for content editing.
- **WYSIWYG editor module** — handles visual text editing using ProseMirror.
- **Markdown markup editor module** — enables text editing with Markdown formatting based on CodeMirror.

### Editor Modes and Modules:

**MarkdownEditor** provides two operating modes:
1. **WYSIWYG mode**:
   Utilizes the **WYSIWYG editor module** and associated toolbar modules.
2. **Markdown markup mode**:
   Utilizes the **Markdown markup editor module** and associated toolbar modules.

## What Modules Are Present in the Current Interface?

### Editor Modules:

1. **WYSIWYG editor module**:
   Provides visual text editing with real-time content updates. It is based on ProseMirror and supports functional extensions via the `extensions` folder.

2. **Markdown markup editor module**:
   Allows direct work with Markdown formatting. It is based on CodeMirror.

### Toolbar Modules:

1. **Main toolbar in WYSIWYG mode**:
   Includes basic editing tools.

2. **Additional toolbar in WYSIWYG mode**:
   Found in the three-dot menu and provides access to advanced tools.

3. **Main toolbar in Markdown markup mode**:
   Contains tools for working with Markdown formatting.

4. **Additional toolbar in Markdown markup mode**:
   Found in the three-dot menu and offers additional Markdown-specific tools.

5. **Selection toolbar in WYSIWYG mode**:
   Appears when text is selected and offers contextual actions.

6. **Slash toolbar in WYSIWYG mode**:
   Activates upon entering the `/` character, allowing quick block selection.

# 2. Structure of Toolbar Buttons

A toolbar button in **MarkdownEditor** is a universal component combining an interface element with functionality for the WYSIWYG editor and Markdown markup editor modules. It should seamlessly integrate into the program's interface while executing actions tied to the **ProseMirror** or **CodeMirror** APIs.

A button can be used in any of the toolbar modules.

Given its universal nature, I propose dividing the button into three independent parts.

### Key Parts of Toolbar Buttons:

1. **Appearance**:
  - Defined within the common area of MarkdownEditor.
  - Specifies the button's visual presentation: icon, text label, and tooltip.
  - Ensures a consistent design across modes.

2. **Actions for the WYSIWYG editor module**:
  - Defined in **extensions for the WYSIWYG editor**.
  - Dictates the button's behavior in WYSIWYG mode.
  - Utilizes the ProseMirror API.

3. **Actions for the Markdown markup editor module**:
  - Defined in **Markdown markup editor configuration files**.
  - Specifies the button's behavior in Markdown markup mode.
  - Utilizes the CodeMirror API.

# 3. Presets for Toolbars

In the current version, toolbar button configurations for WYSIWYG and Markdown modes are defined separately. While this provides flexibility, it also lacks transparency.

I propose making presets the single point of entry for editor configuration.

### Objectives of Presets:

1. **Toolbar Formation**:
   Presets define the structure of toolbars, including the buttons and their order.

2. **Flexible Management**:
   To reduce the core editor's complexity, presets should be passed as external props. This allows users to create their own configurations and decouple the editor's functionality. Additionally, users can import and reuse one of the five predefined presets if needed.

3. **Support for Default Presets**:
   The editor will include five predefined presets, with three of them aligned with MarkdownIt standards:
  - **zero** — minimal button set,
  - **commonmark** — aligned with the CommonMark standard,
  - **default** — basic configuration.

### How It Works:

1. If a user passes a reserved preset name (**zero**, **commonmark**, **default**), the editor automatically applies the corresponding configuration.
2. For all other cases, a user-provided configuration object is expected.

// ---

# 1. Введение концепции модулей

## Зачем нужны модули?

В процессе разработки и использования **MarkdownEditor** возникает путаница в терминологии. Термин "расширение" может обозначать:
- Дополнения к WYSIWYG редактору (на основе **ProseMirror**),
- Дополнения к модулю Markdown markup editor (на основе **CodeMirror**),
- Плагины для разметки Markdown (YFM),
- Элементы интерфейса **MarkdownEditor**,
- Или что-то ещё.

Эта путаница затрудняет поддержку и разработку, увеличивает связанность кода и усложняет масштабируемость.

Чтобы устранить эти проблемы, предлагается ввести понятие **модулей** — элементов, относящихся к интерфейсу программы и выделяющих её общие компоненты. Модули позволят разграничить внутренние механизмы (ProseMirror, CodeMirror) и элементы интерфейса, создавая основу для более ясной архитектуры, а также упрощения проектирования, реализации и поддержки.

### Разграничение термина "редактор":

- **MarkdownEditor** — общая программа, объединяющая модули, расширения и плагины. Это целостная платформа для редактирования контента.
- **Модуль WYSIWYG editor** — отвечает за визуальное редактирование текста с использованием ProseMirror.
- **Модуль Markdown markup editor** — обеспечивает редактирование текста с помощью Markdown разметки на основе CodeMirror.

### Режимы редактора и модули:

**MarkdownEditor** предоставляет два режима работы:
1. **Режим WYSIWYG**:
   Использует **модуль WYSIWYG editor** и связанные модули тулбаров.
2. **Режим разметки Markdown**:
   Использует **модуль Markdown markup editor** и соответствующие модули тулбаров.

## Какие модули можно выделить в текущем интерфейсе?

### Модули редакторов:

1. **Модуль WYSIWYG editor**:
   Обеспечивает визуальное редактирование текста с мгновенным отображением изменений. Построен на ProseMirror и поддерживает функциональные расширения через папку `extensions`.

2. **Модуль Markdown markup editor**:
   Предоставляет возможность работы с разметкой Markdown напрямую. Построен на CodeMirror.

### Модули тулбаров:

1. **Главный тулбар в режиме WYSIWYG**:
   Содержит базовые инструменты редактирования.

2. **Дополнительный тулбар в режиме WYSIWYG**:
   В меню с тремя точками, предоставляет доступ к дополнительным инструментам.

3. **Главный тулбар в режиме разметки Markdown**:
   Содержит инструменты для работы с разметкой Markdown.

4. **Дополнительный тулбар в режиме разметки Markdown**:
   В меню с тремя точками, предоставляет доступ к дополнительным инструментам.

5. **Тулбар при выделении в режиме WYSIWYG**:
   Появляется при выделении текста и предлагает контекстные действия.

6. **Тулбар слэша в режиме WYSIWYG**:
   Активируется при вводе символа `/` и позволяет быстро выбрать блоки.

# 2. Структура кнопки тулбара

Кнопка модуля тулбара в **MarkdownEditor** — это универсальный компонент, сочетающий интерфейсную часть и функциональность модулей WYSIWYG editor и Markdown markup editor. Она должна органично вписываться в интерфейс программы и выполнять действия, связанные с API **ProseMirror** или **CodeMirror**.

Кнопка может быть использована в любом из модулей тулбаров.

С учётом её универсальности, предлагается разделить кнопку на три независимые составляющие.

### Основные части кнопки модулей тулбаров:

1. **Внешний вид**:
  - Определяется в общей части MarkdownEditor.
  - Задаёт визуальное представление кнопки в интерфейсе: иконка, текстовая подпись, всплывающая подсказка.
  - Обеспечивает единый подход к дизайну кнопок, независимо от режима.

2. **Экшены для модуля WYSIWYG editor**:
  - Определяются в **расширениях для WYSIWYG editor**.
  - Задают логику взаимодействия кнопки в режиме WYSIWYG.
  - Используют API ProseMirror.

3. **Экшены для модуля Markdown markup editor**:
  - Определяются в **файлах конфигурации Markdown markup editor**.
  - Задают логику взаимодействия кнопки в режиме разметки Markdown.
  - Используют API CodeMirror.

# 3. Пресеты для тулбаров

В текущей версии конфигурации кнопок тулбаров для режимов WYSIWYG и Markdown задаются отдельно. Это обеспечивает гибкость, но создаёт недостаточную прозрачность.

Предлагается сделать пресеты единой точкой входа для настройки редактора.

### Задачи пресетов:

1. **Формирование тулбаров**:
   Пресеты задают структуру тулбаров, включая состав кнопок и их порядок.

2. **Гибкость управления**:
   Для разгрузки ядра редактора пресеты предлагается передавать через внешний пропс. Это позволит пользователям создавать свои конфигурации и разделять функционал редактора. При необходимости можно импортировать и переиспользовать один из 5 предустановленных пресетов.

3. **Поддержка стандартных пресетов**:
   Редактор будет включать 5 предопределённых пресетов, причём 3 из них будут соответствовать текстовым алиасам для стандартов MarkdownIt:
  - **zero** — минимальный набор кнопок,
  - **commonmark** — соответствие стандарту CommonMark,
  - **default** — базовая конфигурация.

  Если пользователь передаёт зарезервированное имя пресета (**zero**, **commonmark**, **default**), редактор автоматически подставляет соответствующую конфигурацию. Для остальных случаев ожидается объект с пользовательской конфигурацией.
