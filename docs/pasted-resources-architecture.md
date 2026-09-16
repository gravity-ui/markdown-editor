# Архитектура обработки ресурсов при вставке

Схема текущей реализации после переноса из `src/paste/`. Проверена по рабочей
копии **16 сентября 2026 года**. Все пути `src/` ниже относятся к
`packages/editor/src/`, если явно не указано другое.

Документ описывает обработку URL изображений и файлов после вставки. Загрузка
бинарных файлов рассмотрена отдельно, чтобы показать границу с существующими
clipboard-плагинами. Пользовательский API описан в
[руководстве по подключению](how-to-resolve-pasted-resources.md).

## Навигация

1. [Общая карта](#1-общая-карта)
2. [Файлы и ответственность](#2-файлы-и-ответственность)
3. [Создание и подключение](#3-создание-и-подключение)
4. [Данные и идентичность](#4-данные-и-идентичность)
5. [Жизненный цикл запроса](#5-жизненный-цикл-запроса)
6. [WYSIWYG: путь вставки](#6-wysiwyg-путь-вставки)
7. [WYSIWYG: применение результата и история](#7-wysiwyg-применение-результата-и-история)
8. [Markup: расширение CodeMirror](#8-markup-расширение-codemirror)
9. [Markup: распознавание и применение](#9-markup-распознавание-и-применение)
10. [HTML и файловые ссылки](#10-html-и-файловые-ссылки)
11. [История CodeMirror](#11-история-codemirror)
12. [Переключение режимов](#12-переключение-режимов)
13. [Отмена, ошибки и уничтожение](#13-отмена-ошибки-и-уничтожение)
14. [Бинарные файлы и FilesUploadPlugin](#14-бинарные-файлы-и-filesuploadplugin)
15. [Границы и особенности текущего подключения](#15-границы-и-особенности-текущего-подключения)
16. [Сценарии и тесты](#16-сценарии-и-тесты)

## 1. Общая карта

На схемах компонентов сплошная стрелка означает создание, вызов или использование
сервиса. Пунктирная стрелка означает уведомление или передачу результата. Это
связи времени выполнения; таблица файлов ниже уточняет расположение реализаций.

```mermaid
flowchart TB
    App["Приложение<br/>resolvePastedResources / onPasteOperationChange"]
    Hook["useMarkdownEditor"]
    Bundle["EditorImpl<br/>владелец общего контроллера"]
    Controller["PasteController<br/>операции, targets, активный движок"]
    UI["MarkdownEditorView / ToolbarView"]

    subgraph PM["WYSIWYG"]
        WE["WysiwygEditor"]
        WA["ProseMirrorPaste"]
        WP["PM Plugin<br/>DOM events / appendTransaction / view"]
        WC["Clipboard / штатный PM paste<br/>выбор и разбор формата"]
        WS["PM EditorState<br/>документ с resource ID"]
    end

    subgraph CM["Markup"]
        Factory["createCodemirror"]
        CA["CodeMirrorPaste<br/>текущее разделение экземпляров — §3"]
        CE["extension()<br/>StateField / effects / extender / events"]
        CC["Обработчики create.ts<br/>YFM / HTML / текст"]
        CS["CM EditorState<br/>текст + anchorsField"]
        History["PasteCodeMirrorHistory"]
    end

    Hook --> Bundle
    Bundle --> Controller
    Bundle --> WE
    Bundle --> Factory
    WE --> WA
    WA --> WP
    WC -->|"транзакция"| WA
    WA -->|"apply"| WS
    Factory --> CA
    CA --> CE
    CC -->|"транзакция"| CE
    CE --> CS
    CA --> History
    WA -->|"createTarget / resolveTargets / register"| Controller
    CA -->|"createTarget / resolveTargets / register"| Controller
    Controller -->|"snapshot / restore / flush"| WA
    Controller -->|"snapshot / restore / flush"| CA
    Controller -->|"callback с AbortSignal"| App
    App -.->|"replacements"| Controller
    Controller -.->|"subscribe: изменение pending"| Bundle
    Bundle -.->|"rerender / rerender-toolbar"| UI
```

Основной порядок: **вставка документа → запрос приложения → изменение URL**.
Управление редактором остаётся доступным во время запроса.

## 2. Файлы и ответственность

| Файл                                                                                                                | Основные сущности                                               | Ответственность                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [bundle/useMarkdownEditor.ts](../packages/editor/src/bundle/useMarkdownEditor.ts)                                   | `useMarkdownEditor`                                             | Сборка параметров и жизненный цикл экземпляра редактора                             |
| [bundle/Editor.ts](../packages/editor/src/bundle/Editor.ts)                                                         | `EditorImpl`                                                    | Создание контроллера; передача его движкам; смена режима; публичные операции отмены |
| [bundle/types.ts](../packages/editor/src/bundle/types.ts)                                                           | `MarkdownEditorOptions`                                         | Подключение `paste` к API редактора и экспорт типов                                 |
| [bundle/editor-public-types.ts](../packages/editor/src/bundle/editor-public-types.ts)                               | `MarkdownEditorInstance`                                        | Включение `PasteOperationControl` в публичный интерфейс                             |
| [modules/paste/types.ts](../packages/editor/src/modules/paste/types.ts)                                             | `PasteIntegration`, `PastedResource`, `PasteResourceResolution` | Контракт приложения                                                                 |
| [modules/paste/tracking.ts](../packages/editor/src/modules/paste/tracking.ts)                                       | `ResourceTarget`, `ResourceOccurrence`, `PasteEngine`           | Общая идентичность и интерфейс движка                                               |
| [modules/paste/controller.ts](../packages/editor/src/modules/paste/controller.ts)                                   | `PasteController`, `validateResolution`                         | Асинхронные операции, проверка ответа, отмена, таймауты, сохранение результатов     |
| [core/Editor.ts](../packages/editor/src/core/Editor.ts)                                                             | `WysiwygEditor`                                                 | Создание PM-адаптера, подключение его плагина и `dispatch`                          |
| [Clipboard/index.ts](../packages/editor/src/extensions/behavior/Clipboard/index.ts)                                 | `Clipboard`                                                     | Регистрация существующих clipboard-плагинов через builder                           |
| [Clipboard/clipboard.ts](../packages/editor/src/extensions/behavior/Clipboard/clipboard.ts)                         | `clipboard`                                                     | Чтение форматов буфера и вставка содержимого                                        |
| [Clipboard/resources/adapter.ts](../packages/editor/src/extensions/behavior/Clipboard/resources/adapter.ts)         | `ProseMirrorPaste`                                              | Идентификация вставки, ID узлов, применение URL, связь с PM history                 |
| [Clipboard/resources/resources.ts](../packages/editor/src/extensions/behavior/Clipboard/resources/resources.ts)     | `ResourceCollection`, функции обхода и сравнения                | Работа с PM-моделью и проверка URL; используется также Markup-частью                |
| [ImageSpecs/index.ts](../packages/editor/src/extensions/markdown/Image/ImageSpecs/index.ts)                         | Схема изображения                                               | Атрибут `__pasteResourceId`, исключаемый из HTML                                    |
| [YfmFileSpecs/index.ts](../packages/editor/src/extensions/yfm/YfmFile/YfmFileSpecs/index.ts)                        | Схема файла                                                     | Атрибут ID, исключаемый из HTML и Markdown                                          |
| [markup/codemirror/create.ts](../packages/editor/src/markup/codemirror/create.ts)                                   | `createCodemirror`                                              | Создание CM-адаптера, расширений и обработчиков clipboard                           |
| [paste-resources/adapter.ts](../packages/editor/src/markup/codemirror/paste-resources/adapter.ts)                   | `CodeMirrorPaste`                                               | Диапазоны ресурсов, effects, транзакции и регистрация движка                        |
| [paste-resources/resources.ts](../packages/editor/src/markup/codemirror/paste-resources/resources.ts)               | `prepareMarkupResources`, `referenceImages`                     | Поиск и проверка исходных диапазонов Markdown                                       |
| [paste-resources/history.ts](../packages/editor/src/markup/codemirror/paste-resources/history.ts)                   | `PasteCodeMirrorHistory`                                        | Коррекция более раннего события истории CodeMirror                                  |
| [paste-resources/history-boundary.ts](../packages/editor/src/markup/codemirror/paste-resources/history-boundary.ts) | `pasteHistoryBoundary`                                          | Facet с callbacks для внешней группировки истории                                   |
| [html-to-markdown/converters.ts](../packages/editor/src/markup/codemirror/html-to-markdown/converters.ts)           | `MarkdownConverter`                                             | Преобразование HTML; callback `fileLink` для файловых вложений                      |
| [files-upload-plugin/plugin.ts](../packages/editor/src/markup/codemirror/files-upload-plugin/plugin.ts)             | `FilesUploadPlugin`, presenter, widget                          | Отдельная загрузка бинарных файлов                                                  |

## 3. Создание и подключение

### 3.1. Общий владелец

`EditorImpl` создаёт `PasteController` всегда, даже без callback разрешения ресурсов.
`controller.enabled` равен наличию `resolvePastedResources`. Параметры callback
задаются при создании; метода их динамической замены нет.

Движки создаются лениво, при обращении к `wysiwygEditor` и `markupEditor`.
Каждый получает ссылку на один и тот же контроллер.

```mermaid
sequenceDiagram
    participant H as useMarkdownEditor
    participant B as EditorImpl
    participant C as PasteController
    participant W as WysiwygEditor
    participant P as ProseMirrorPaste
    participant V as PM EditorView
    H->>B: new EditorImpl(options)
    B->>C: new PasteController(options.paste)
    B->>C: subscribe(rerender callbacks)
    Note over B,W: WYSIWYG создаётся при первом обращении
    B->>W: new WysiwygEditor({pasteController})
    W->>P: new ProseMirrorPaste(controller)
    W->>P: plugin()
    W->>V: new EditorView(state + plugins + dispatchTransaction)
    V->>P: plugin.view(view)
    P->>C: register(wysiwyg, snapshot / restore / flush)
```

В PM создание адаптера пока проверяет наличие контроллера, а не `enabled`.
Существующий `Clipboard` регистрируется через `ExtensionBuilder`; ресурсный
адаптер подключается напрямую в `core/Editor.ts`.

### 3.2. Фактическое подключение CodeMirror в рабочей копии

На момент составления документа `create.ts` создаёт **два** объекта
`CodeMirrorPaste`. Это важно для чтения последующих схем.

```mermaid
flowchart LR
    F["createCodemirror<br/>enabled + pasteParser"]
    A["Экземпляр A<br/>const paste"]
    B["Экземпляр B<br/>new CodeMirrorPaste(...).extension()"]
    Dispatch["dispatchTransactions"]
    Attach["Регистрация PasteEngine"]
    State["EditorState extensions"]
    HA["A.history.compartment"]
    HB["B.history.compartment"]
    Shared["Общие определения модуля<br/>anchorsField / pasted / resolved / effects"]
    F --> A
    F --> B
    A --> Dispatch
    A --> Attach
    A --> HA
    B --> State
    B --> HB
    HA -.->|"не тот Compartment, который установлен B"| State
    A --> Shared
    B --> Shared
```

`extension()` замыкает `event`, `shift` и `history` экземпляра B, а `dispatch`,
`attach`, `restore`, `flush` используют экземпляр A. Определения `StateField`,
annotations и effects находятся на уровне модуля и поэтому общие.

Однако `history.compartment` создаётся на экземпляр: в состоянии установлен
Compartment B, а коррекция истории из A обращается к Compartment A. Это разрыв
связи в текущем подключении. Следующие разделы описывают алгоритмы методов;
они не являются подтверждением корректной работы двух экземпляров вместе.

Связное подключение одного экземпляра выглядело бы так:

```ts
const paste =
  params.pasteController?.enabled && params.pasteParser
    ? new CodeMirrorPaste(params.pasteController, params.pasteParser)
    : undefined;

if (paste) extensions.push(paste.extension());
// Этот же paste используется в dispatchTransactions и attach(view).
```

Это пояснение схемы, а не изменение реализации в рамках документа.

## 4. Данные и идентичность

```mermaid
flowchart TB
    Controller["PasteController"]
    Pending["pending: Map<br/>operationId → Pending"]
    Operation["Pending<br/>operationId / AbortController / timer / prepared"]
    Prepared["InsertedPaste<br/>resources / apply / release"]
    Targets["targets: Map<br/>targetId → ResourceTarget"]
    Target["ResourceTarget<br/>id / resource / replacement?"]
    Resource["PastedResource<br/>kind / path / name?"]
    Engine["engines: Map<br/>mode → PasteEngine"]
    PMNode["PM node.attrs.__pasteResourceId"]
    Anchor["CM Anchor<br/>id / from / to / labelTo?"]
    Snapshot["ResourceOccurrence<br/>kind / path / targetId?"]
    Controller --> Pending
    Pending --> Operation
    Operation --> Prepared
    Prepared --> Resource
    Prepared -.->|"apply замыкает targets операции"| Target
    Controller --> Targets
    Targets --> Target
    Target --> Resource
    Controller --> Engine
    PMNode -->|"targetId"| Target
    Anchor -->|"id"| Target
    Snapshot -->|"targetId"| Target
```

Три разных понятия:

- **Операция** — один асинхронный вызов приложения, ID вида `paste-N`.
- **Ресурс** — пара `kind + path`; `resourceKey` кодирует её через `JSON.stringify`.
- **Target** — отслеживаемый экземпляр ресурса с UUID. В PM это конкретный узел;
  в CM обычно исходный диапазон URL или ссылочного изображения.

Одинаковые ресурсы дедуплицируются внутри запроса, но несколько targets могут
ссылаться на одну пару `kind + path`. Разные вставки имеют отдельные targets.
Сопоставление ответа ограничено ресурсами конкретной операции.

`pending` очищается при завершении операции. `targets` и полученные замены
сохраняются до уничтожения контроллера: они нужны, если Undo убрал вставку,
а Redo позже вернул её. Это состояние в памяти, не сохраняемое в Markdown.

## 5. Жизненный цикл запроса

```mermaid
sequenceDiagram
    participant A as Адаптер активного движка
    participant C as PasteController
    participant App as Приложение
    A->>C: resolveTargets(resources, targets, validatePath)
    C->>C: start(prepared)
    C->>C: Записать pending, создать AbortController и timer
    C-->>App: onPasteOperationChange(pending)
    Note over C,App: Обработчик pending может сразу отменить операцию
    C->>App: resolvePastedResources(resources, operationId + signal)
    App-->>C: Promise с replacements
    C->>C: Проверить, что операция ещё pending
    C->>C: validateResolution: структура и точные kind + oldPath
    C->>A: validatePath для всех новых URL
    C->>C: Сохранить replacement в targets
    C->>A: flush() текущего активного движка
    A->>A: Обновить сохранившиеся привязанные ресурсы
    C->>C: finish(succeeded): убрать pending и timer, release
    C-->>App: onPasteOperationChange(succeeded)
```

| Метод контроллера                          | Смысл                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `register(mode, engine)`                   | Сохранить callbacks адаптера; вернуть функцию удаления регистрации            |
| `activate(mode, snapshot?)`                | Назначить активный режим, при наличии восстановить snapshot, вызвать `flush`  |
| `snapshot()`                               | Запросить состояние привязок у активного движка, если обработка включена      |
| `createTarget(resource)` / `getTarget(id)` | Создать или получить идентичность ресурса                                     |
| `resolveTargets(...)`                      | Подготовить операцию: проверка URL, сохранение результатов, применение        |
| `start(prepared)`                          | Зарегистрировать pending, таймаут и запустить callback                        |
| `resolve(operation)`                       | Дождаться ответа, проверить актуальность и применить результат                |
| `finish(...)`                              | Единожды завершить операцию, освободить её состояние и уведомить наблюдателей |
| `cancelPaste(id)`                          | Завершить указанную операцию как cancelled                                    |
| `fail(id, error)`                          | Завершить указанную pending-операцию как failed                               |
| `getPendingPasteOperations()`              | Вернуть список выполняющихся операций                                         |
| `subscribe(listener)`                      | Подписать внутреннюю оболочку редактора на изменение pending                  |
| `destroy()`                                | Отменить все pending и очистить targets, регистрации и подписки               |

`validateResolution` отклоняет неизвестные пары `kind + oldPath`, пустые новые
пути, неверную структуру и противоречивые дубликаты. Одинаковые дубликаты допустимы.
Пропущенные ресурсы и пустой список замен сохраняют исходные URL.

Перед сохранением результатов проверяются все возвращённые URL. Если `flush`
бросает ошибку, кеш замены у targets этой операции очищается. Общий контроллер
не реализует откат уже применённых транзакций документа.

`succeeded` означает, что ответ обработан. Это не гарантирует, что изменено
столько же вхождений, сколько было вставлено: пользователь мог удалить их,
изменить URL или выполнить Undo.

## 6. WYSIWYG: путь вставки

### 6.1. Плагин и обёртка dispatch

```mermaid
flowchart TB
    DOM["DOM paste"]
    Observe["ProseMirrorPaste.plugin<br/>запомнить plain / shift / code / files"]
    Clipboard["Clipboard / стандартный PM paste<br/>разобрать данные и построить транзакцию"]
    Dispatch["WysiwygEditor.dispatchTransaction"]
    Adapter["ProseMirrorPaste.dispatch(view, tr, apply)"]
    Gate{"Это обрабатываемая вставка?"}
    Ordinary["Обычная правка:<br/>при ручной смене URL снять resource ID"]
    Ranges["Вычислить добавленные диапазоны<br/>через tr.mapping"]
    Targets["Обойти tr.doc в диапазонах<br/>создать targets и записать ID в attrs"]
    Apply["apply(closeHistory(tr))<br/>EditorState.applyTransaction → updateState"]
    Accepted{"Транзакция принята<br/>и targets остались?"}
    Resolve["controller.resolveTargets"]
    Done["Завершить обработку"]
    DOM --> Observe
    Observe -->|"return false"| Clipboard
    Clipboard --> Dispatch
    Dispatch --> Adapter
    Adapter --> Gate
    Gate -->|"нет"| Ordinary
    Ordinary -->|"apply(tr)"| Done
    Gate -->|"да"| Ranges
    Ranges --> Targets
    Targets --> Apply
    Apply --> Accepted
    Accepted -->|"да"| Resolve
    Accepted -->|"нет"| Done
```

Условие вставки включает `enabled`, `docChanged`, контекст DOM paste или
`uiEvent = paste`. Исключаются собственная замена (`resolvedPasteMeta`), remote
транзакция и `plain`-контекст. Plain здесь включает Shift, позицию внутри кода
или специальный случай бинарных файлов. Контекст DOM-события сбрасывается в microtask.

Существующий `Clipboard` обрабатывает YFM и текст своими parsers, отдельный
случай iOS URI list, извлекаемый Markdown из HTML и загрузку файлов. Обычный HTML
может передаваться штатной PM-вставке. Ресурсный адаптер не заменяет эту логику.

### 6.2. Дополнение транзакции

1. Для подходящих локальных изменений создаётся копия транзакции с отдельными
   `steps`, `docs`, `mapping`, `meta`. Это защита от предварительного вычисления
   исходного объекта обёртками dispatch, например DevTools.
2. Новые диапазоны каждого шага переводятся через оставшиеся mapping в
   координаты итогового `tr.doc`.
3. Обход пропускает code-узлы и узлы с code-mark.
4. `resourceAttribute` распознаёт `image.src` и `FILE_TOKEN.href`.
5. `ResourceCollection.add` собирает уникальные ресурсы; каждому вхождению
   назначается target и атрибут `__pasteResourceId`.
6. Транзакция применяется с границами истории до и после вставки.
7. Проверяется, вошла ли она в принятые `applyTransaction` транзакции и какие ID
   присутствуют в итоговом документе. Только оставшиеся targets идут в запрос.

Фильтры ProseMirror могут отклонить вставку, а `appendTransaction` других плагинов
может нормализовать документ. Поэтому запуск запроса находится после `apply`.

## 7. WYSIWYG: применение результата и история

```mermaid
flowchart TD
    Trigger["controller.flush<br/>или plugin.appendTransaction после docChanged"]
    Active{"enabled и активен WYSIWYG?"}
    Traverse["replacements(state): обход документа"]
    Match{"Есть target по ID,<br/>replacement задан,<br/>URL ещё равен исходному?"}
    Validate["validateLink + encodeResourceUrl"]
    Attr["tr.setNodeAttribute(pos, src или href, newUrl)"]
    Meta["addToHistory = false<br/>resolvedPasteMeta = true"]
    Apply["Применить транзакцию"]
    Skip["Пропустить узел / нет транзакции"]
    Trigger --> Active
    Active -->|"да"| Traverse
    Active -->|"нет"| Skip
    Traverse --> Match
    Match -->|"да"| Validate
    Match -->|"нет"| Skip
    Validate --> Attr
    Attr --> Meta
    Meta --> Apply
```

`flush` также проверяет уничтожение view, редактируемость и отсутствие той же
неприменённой замены после dispatch. Атрибут меняется отдельным шагом, поэтому
остальные атрибуты, содержимое узла и выделение не заменяются целиком.

Для обычной локальной правки `dispatch` сравнивает URL по resource ID в
`tr.before` и `tr.doc`. Изменившемуся URL сбрасывается ID **в той же транзакции**.
Undo такой правки может восстановить и исходный URL, и привязку.
Эта процедура исключает remote, собственные замены и транзакции истории.

При Undo вставки узел исчезает, но target с результатом остаётся в контроллере.
После Redo узел с ID возвращается; `appendTransaction` снова применяет кешированный
URL. Повторного запроса приложения не требуется.

## 8. Markup: расширение CodeMirror

`CodeMirrorPaste` состоит из декларативной настройки состояния и методов,
которые вызываются из `createCodemirror`.

```mermaid
flowchart TB
    Adapter["CodeMirrorPaste"]
    Ext["extension()"]
    Field["anchorsField: StateField<br/>Anchor[]"]
    Effects["addAnchors / removeAnchors<br/>StateEffect"]
    Inverse["invertedEffects<br/>обратные эффекты истории"]
    Extender["transactionExtender<br/>классификация вставки, anchors и annotations"]
    Events["Prec.highest + DOM handlers<br/>shift / code / paste context"]
    Compartment["history.compartment.of([])"]
    Dispatch["dispatch(view, transactions, apply)"]
    Attach["attach(view)<br/>register markup engine"]
    Flush["flush(view)<br/>применить готовые URL"]
    Adapter --> Ext
    Ext --> Field
    Ext --> Inverse
    Ext --> Extender
    Ext --> Events
    Ext --> Compartment
    Extender --> Effects
    Effects --> Field
    Inverse --> Effects
    Adapter --> Dispatch
    Adapter --> Attach
    Attach --> Flush
    Dispatch --> Flush
```

| Элемент               | Данные и поведение                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Anchor`              | `id`, `from`, `to`, необязательный `labelTo` для ссылочного изображения                                                |
| `mapAnchor`           | Пересчитывает позиции через изменения; при затрагивании URL снимает привязку; допускает правку подписи reference image |
| `anchorsField`        | На каждой транзакции обновляет позиции и применяет add/remove effects                                                  |
| `addAnchors`          | Добавляет привязки; имеет собственное правило mapping эффекта                                                          |
| `removeAnchors`       | Удаляет привязки по ID                                                                                                 |
| `pasted`              | Annotation с targets вставки; соединяет transaction extender и dispatch                                                |
| `resolved`            | Annotation собственной автоматической замены                                                                           |
| `invertedEffects`     | Описывает обратные изменения набора привязок для Undo/Redo                                                             |
| `transactionExtender` | Обнаруживает вставку, создаёт targets, добавляет effects и `isolateHistory`                                            |
| `attach`              | Регистрирует snapshot/restore/flush; возвращает функцию удаления регистрации                                           |
| `dispatch`            | Вызывает границы внешней истории, применяет транзакции, запускает запрос и повторное применение кеша                   |

`applying` защищает `flush` от повторного входа во время собственного dispatch.
`destroyed` предотвращает применение после удаления регистрации.

## 9. Markup: распознавание и применение

### 9.1. От события до запроса

```mermaid
sequenceDiagram
    participant DOM as DOM paste
    participant E as extension: events + transactionExtender
    participant H as Обработчик clipboard в create.ts
    participant R as prepareMarkupResources
    participant D as CodeMirrorPaste.dispatch
    participant V as CM EditorView
    participant C as PasteController
    DOM->>E: Запомнить shift / code
    E-->>DOM: false — продолжить обработку
    DOM->>H: Прочитать YFM / HTML / text
    H->>E: Создать транзакцию изменения текста
    E->>R: Разобрать новый документ и вставленные фрагменты
    R-->>E: resources / spans / occurrences / references
    E->>C: createTarget(resource)
    E->>E: addAnchors + pasted(targets) + isolateHistory(full)
    E->>D: Подготовленные транзакции
    D->>D: Вызвать pasteHistoryBoundary callbacks
    D->>V: apply: view.update(transactions)
    D->>D: Повторно вызвать history boundary callbacks
    D->>C: resolveTargets(resources, targets, validatePath)
    D->>D: flush кешированных замен после docChanged
```

Extender исключает remote-транзакции, `resolved`, plain-контекст и операции,
которые не являются вставкой. Отдельно проверяет изменения определений
ссылочных изображений и снимает устаревшие привязки.

### 9.2. Как находится исходный диапазон URL

```mermaid
flowchart TD
    Source["Исходный Markdown"]
    Parse["Настроенный parser.parse(source)"]
    Collect["PM ResourceCollection + resourceOccurrences"]
    Candidates["Найти текстовые варианты URL<br/>исходный, decodeURI, escapes, entities"]
    Probe["Подставить уникальный marker URL<br/>и повторно разобрать Markdown"]
    Restore["В пробном PM-документе<br/>вернуть исходный URL"]
    Compare{"comparableFragment<br/>совпадает с исходным?"}
    Span["Принять span<br/>from / to / key / occurrences"]
    Reject["Отбросить совпадение"]
    Ref["Lezer Image candidates<br/>referenceImages"]
    Source --> Parse
    Parse --> Collect
    Collect --> Candidates
    Candidates --> Probe
    Probe --> Restore
    Restore --> Compare
    Compare -->|"да"| Span
    Compare -->|"нет"| Reject
    Source --> Ref
    Ref -->|"проверка через тот же parser и сравнение PM"| Span
```

Сравнение исключает случайно генерируемые DOM ID вкладок и чекбоксов. Оно не
исключает содержание, URL или остальные значимые атрибуты.

Обычный текст, код и адрес обычной ссылки не должны проходить эту проверку как
ресурс изображения/файла. Неподдерживаемый диапазон может быть сообщён приложению,
но без надёжной привязки результат не перепишет произвольное совпадение URL.

`prepareMarkupResources` также возвращает вспомогательный `replace(...)` с
проверкой итоговой структуры. Основной `CodeMirrorPaste.flush` использует найденные
spans; для reference image вызывает `reference.replace(...)`.

### 9.3. Применение ответа

`flush` выбирает anchors, для которых есть новый URL, затем заново проверяет их
против актуального текста и parser. Обычный URL заменяется в своём диапазоне.

Reference image переводится в inline image, например:

```md
![report][attachment]

[attachment]: /old.png
```

становится для выбранного вхождения:

```md
![report](/new.png)

[attachment]: /old.png
```

Общее определение сохраняется. Другие использования `attachment` не получают
замену автоматически. Подпись сохраняется отдельным диапазоном; title также
сохраняется и экранируется.

Перед dispatch проверяются readOnly/editable. Изменения сортируются, новые
anchors вычисляются в координатах нового документа. Транзакция получает
`resolved = true` и `addToHistory = false`, а история корректируется через
`PasteCodeMirrorHistory.amend`. После dispatch проверяется ожидаемый документ.

## 10. HTML и файловые ссылки

```mermaid
flowchart LR
    HTML["clipboard text/html"]
    DOM["Browser DOMParser"]
    Converter["MarkdownConverter.processNode"]
    Link["visitLink: HTMLAnchorElement"]
    Callback["fileLink callback из EditorImpl"]
    PM["PMDOMParser.fromSchema<br/>схема WysiwygEditor"]
    Check{"Получен FILE_TOKEN?"}
    File["serializer.serialize<br/>YFM file markup"]
    Normal["Обычная Markdown-ссылка"]
    Insert["Вставка Markdown<br/>дальше resource tracking"]
    HTML --> DOM --> Converter --> Link
    Link --> Callback --> PM --> Check
    Check -->|"да"| File --> Insert
    Check -->|"нет: undefined"| Normal --> Insert
```

`fileLink` передаётся конвертеру только при `pasteController.enabled`.
Callback распознаёт тип по правилам PM-схемы; обычная ссылка не становится файлом
только из-за расширения `.pdf` или похожего URL.

Без сохранения файловой семантики HTML-вложение стало бы обычной ссылкой и не
попало бы в обработку ресурсов. Приоритет `text/yfm` позволяет использовать
готовую разметку без HTML-конвертации, если она есть в буфере.

## 11. История CodeMirror

Вставка сразу меняет документ, а URL приходит позже, возможно после нескольких
других правок. `addToHistory = false` сам по себе не описывает, как связать позднюю
замену с более ранним событием вставки. Для этого есть `PasteCodeMirrorHistory`.

```mermaid
flowchart TD
    Paste["Вставка + addAnchors<br/>isolateHistory(full)"]
    History["CM historyField<br/>done / undone"]
    Invert["invertedEffects<br/>removeAnchors для отмены вставки"]
    Edit["Последующие пользовательские правки"]
    Patch["Поздняя замена URL"]
    Amend["history.amend(transaction, owns)"]
    Find["Найти событие вставки<br/>по removeAnchors с нужным ID"]
    Mapping["Пересчитать более новые события<br/>и включить inverse patch в отмену вставки"]
    Install["compartment.reconfigure<br/>historyField.init с исправленной историей"]
    Paste --> History
    Paste --> Invert --> History
    Edit --> History
    Patch --> Amend
    History --> Amend
    Amend --> Find --> Mapping --> Install
```

- `tagLast` добавляет effect в последнее событие с изменением документа. Это
  используется при восстановлении привязок после смены режима.
- `amend` идёт по истории от новых событий к старым, находит событие нужной
  вставки и пересчитывает изменения и выделения.
- Старые объекты истории не изменяются на месте: создаются копии с исходными
  прототипами.
- Реализация использует внутреннюю форму `HistoryState/HistoryEvent` из
  `@codemirror/commands`. Проверка поддерживаемой формы есть в `amend`.
- Без `historyField` методы коррекции возвращают пустой набор effects.
- `pasteHistoryBoundary` — отдельный facet для внешних механизмов истории.
  Он вызывает переданные функции до и после вставки; сам по себе не реализует
  совместное редактирование или внешнюю историю.

Для этой схемы принципиально, чтобы установленный Compartment принадлежал
экземпляру, вызывающему `amend/tagLast`; см. расхождение в §3.2.

## 12. Переключение режимов

```mermaid
sequenceDiagram
    participant B as EditorImpl
    participant C as PasteController
    participant Old as Старый адаптер
    participant New as Новый движок и адаптер
    B->>C: snapshot()
    C->>Old: snapshot()
    Old-->>B: Упорядоченные ResourceOccurrence[]
    B->>B: currentMode = nextMode: перенос содержимого
    B->>New: currentEditor.getValue(): обеспечить создание движка
    B->>C: activate(nextMode, snapshot)
    C->>New: restore(snapshot)
    New->>New: Проверить полный список kind + path
    alt Список совпадает
        New->>New: Восстановить ID узлов или anchors
    else Список изменился
        New->>New: Не переносить неоднозначные привязки
    end
    C->>New: flush() готовых результатов
    B-->>B: rerender и change-editor-mode
```

Snapshot включает и ресурсы без target ID, чтобы проверить полное соответствие
порядка. PM восстанавливает ID через транзакцию без истории; CM пересоздаёт anchors
и связывает их эффекты с историей.

Контроллер не отменяет запросы при смене режима. Когда ответ приходит, он
вызывает `flush` у **текущего** активного движка. Это перенос идентичности ресурсов,
а не перенос всей истории редактирования между ProseMirror и CodeMirror.

## 13. Отмена, ошибки и уничтожение

```mermaid
stateDiagram-v2
    [*] --> Pending: start с callback и непустыми resources
    Pending --> Succeeded: валидный ответ и успешный apply
    Pending --> Failed: reject / timeout / invalid result / apply error
    Pending --> Cancelled: cancelPaste или destroy
    Succeeded --> [*]
    Failed --> [*]
    Cancelled --> [*]
```

Если callback отсутствует, ресурсов нет или контроллер уничтожен, `start`
возвращает `false` без создания pending-операции.

Порядок `finish`:

1. Проверить, что это всё ещё та же pending-операция.
2. Очистить таймер и удалить запись из `pending`.
3. Вызвать `prepared.release()`; для `resolveTargets` сейчас это пустая функция.
4. Для failed/cancelled вызвать `AbortController.abort()`.
5. Уведомить внутренние подписки и затем `onPasteOperationChange`.

Повторное завершение и поздний ответ игнорируются. Ошибки наблюдателей передаются
в `reportError`. Отмена не удаляет уже вставленное содержимое и не обещает
отката действий сервера. Таймаут по умолчанию — 120 секунд.

### Фактические точки уничтожения

```mermaid
flowchart TD
    B["EditorImpl.destroy"]
    C["PasteController.destroy<br/>cancel pending, clear targets / engines / listeners"]
    W["WysiwygEditor.destroy → PM view.destroy"]
    WP["PM plugin view.destroy<br/>unregister + controller.destroy"]
    M["CM view.destroy wrapper"]
    MA["attach cleanup<br/>destroyed = true + unregister"]
    B --> C
    B --> W --> WP --> C
    B --> M --> MA
    M --> C
```

Хотя владельцем контроллера является `EditorImpl`, текущие destroy-hooks движков
тоже вызывают `controller.destroy()`. Поэтому отдельное уничтожение одного
движка не изолировано: оно завершает общие операции. Обычное переключение режима
сохраняет экземпляры движков и не использует этот путь уничтожения.

## 14. Бинарные файлы и FilesUploadPlugin

Это соседняя функциональность с другим входом и жизненным циклом.

```mermaid
sequenceDiagram
    participant U as Paste или Drop с File
    participant P as FilesUploadPlugin
    participant S as CM state / decorations
    participant R as FileUploadPresenter
    participant W as FileUploadWidget
    participant App as handlers.uploadFile
    U->>P: Clipboard/FileList
    P->>S: Пробелы-заглушки + AddUploadWidgetEffect
    S->>P: update(transactions)
    P->>R: Создать presenter для File
    R->>W: Показать uploading
    R->>App: uploadFile(file)
    App-->>R: URL, name, type
    R->>W: Показать success
    R->>S: RemoveUploadWidgetEffect с готовым Markdown
    S->>P: Найти decoration по ID и убрать её
    P->>S: Отложенный dispatch вставки Markdown
```

| Свойство                | FilesUploadPlugin                                    | Paste resources                                          |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Вход                    | Бинарные `File`                                      | URL ресурсов в документе                                 |
| Пока выполняется запрос | Виджет и пробел-заглушка                             | Уже вставленный редактируемый контент                    |
| Позиция                 | DecorationSet с mapping                              | PM ID или CM StateField с anchors                        |
| Настройки               | `FileUploadHandlerFacet`                             | Контроллер и parser, переданные при создании             |
| Отмена                  | Presenter выставляет canceled и игнорирует результат | AbortSignal, статус, таймаут и защита от позднего ответа |
| История                 | Обычные транзакции плагина                           | Дополнительное отслеживание и коррекция истории          |
| Смена режима            | В этом плагине нет переноса операции между движками  | Общий controller + snapshot/restore                      |

`FileUploadWidget` использует `ReactRendererFacet` для отрисовки статуса.
При уничтожении widget вызывается `presenter.cancel()`. Это логическая отмена;
контракт `uploadFile(file)` не передаёт AbortSignal.

В WYSIWYG существуют `Clipboard.pasteFileHandler` и поведение `FilePaste`.
Последнее вставляет имена файлов как fallback для paste/drop. Эти механизмы
не являются `ProseMirrorPaste` и не должны смешиваться с разрешением URL.

## 15. Границы и особенности текущего подключения

```mermaid
flowchart LR
    Common["modules/paste<br/>контроллер + типы"]
    PM["Clipboard/resources<br/>PM adapter и document helpers"]
    CM["markup/paste-resources<br/>CM adapter и source helpers"]
    Parser["WysiwygEditor.parser"]
    Schema["WysiwygEditor schema + serializer"]
    Converter["MarkdownConverter.fileLink"]
    PM -->|"использует контракт"| Common
    CM -->|"использует контракт"| Common
    CM -->|"PM model helpers"| PM
    CM -->|"callback parser()"| Parser
    Converter -->|"callback из bundle"| Schema
```

1. **Контроллер не зависит от движков.** Его зависимости — локальные типы,
   tracking и генерация UUID.
2. **Адаптеры не полностью независимы по импорту.** CM использует PM-функции
   проверки структуры. PM resource helpers не импортируют CodeMirror.
3. **Parser привязан к визуальному редактору.** Callback
   `() => this.wysiwygEditor.parser` может лениво создать весь WYSIWYG-движок.
   Аналогично `pasteFileLink` использует его schema и serializer.
4. **PM-ядро знает о paste.** `core/Editor.ts` создаёт адаптер и оборачивает
   dispatch; это не только обычное `builder.addPlugin` внутри `Clipboard`.
5. **Схемы изображения и файла знают о tracking.** В них объявлен атрибут ID,
   который исключается из выходной разметки.
6. **Включение асимметрично.** CM проверяет `enabled`, PM пока проверяет только
   наличие контроллера. HTML file conversion также зависит от `enabled`.
7. **В текущем CM-подключении два экземпляра.** Это зафиксировано в §3.2;
   диаграммы алгоритмов не скрывают эту проблему сборки.
8. **Destroy движка завершает общий controller.** Это ограничивает независимый
   жизненный цикл движков; см. §13.
9. **Метаданные не заменяют интеграцию с collaboration.** PM учитывает
   `remotePasteTransactionMeta`/`rebased`, CM — `Transaction.remote` при
   классификации вставки. Внешний код должен корректно маркировать свои операции.
10. **ID и результаты не сериализуются как постоянное состояние.** Они живут с
    экземпляром редактора; для произвольной внешней замены всего документа нет
    универсального восстановления привязок.

Это наблюдения по текущему коду, а не список уже выполненных исправлений.

## 16. Сценарии и тесты

| Сценарий                                                    | Механизм                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Две вставки одного URL завершились в обратном порядке       | Отдельные операции и targets; ответ ограничен ресурсами своей операции |
| Пользователь ввёл текст перед ресурсом                      | PM ID остаётся на узле; CM пересчитывает диапазон                      |
| Пользователь поменял URL                                    | PM снимает ID; CM снимает или перепроверяет anchor                     |
| Пользователь поменял подпись                                | URL остаётся связанным; reference image допускает изменения label      |
| Ресурс удалён или вставка отменена                          | Нет живого узла/anchor; callback не вставляет его заново               |
| Ответ пришёл после Undo                                     | Результат кешируется в target для последующего Redo                    |
| В документе уже был такой URL                               | Старое вхождение не получает target текущей вставки                    |
| Смена режима во время запроса                               | Сопоставление полного списка ресурсов и перенос ID                     |
| При смене режима изменился список ресурсов                  | Неоднозначные привязки не восстанавливаются                            |
| Callback вернул неверный URL                                | Проверка ответа и parser validation до сохранения всех замен           |
| Callback вернул только часть ресурсов                       | Остальные URL сохраняются                                              |
| Пользователь отменил одну из операций                       | Отменяется только её signal; остальные операции продолжаются           |
| Поздний ответ после отмены                                  | Проверка актуальности pending отклоняет результат                      |
| Reference definition используется несколькими изображениями | Замена выбранного вхождения в inline-форме; definition сохраняется     |
| Редактор стал readOnly перед ответом                        | Адаптер отклоняет требуемое изменение документа                        |

Источники сценариев:

- [controller.test.ts](../packages/editor/src/modules/paste/controller.test.ts) —
  жизненный цикл, отмена, таймауты, валидация и параллельные операции.
- [integration.test.ts](../packages/editor/tests/paste/integration.test.ts) —
  оба движка, форматы clipboard, история, remote mappings, reference images,
  ручные изменения и отказ применения.
- [PasteResources.visual.test.tsx](../demo/tests/visual-tests/PasteResources.visual.test.tsx) —
  браузерные сценарии с React-оболочкой.
- [PasteResources.helpers.tsx](../demo/tests/visual-tests/PasteResources.helpers.tsx) —
  управляемый callback, кнопки разрешения/отмены и наблюдение событий.

Наличие сценария в тестах не означает, что текущая изменяемая рабочая копия
проверена им. При создании этой документации runtime-тесты редактора не запускались;
отдельно проверяются ссылки и синтаксис Mermaid-диаграмм.
