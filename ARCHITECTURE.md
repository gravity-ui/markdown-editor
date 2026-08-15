# Architecture Overview

This document describes the high-level architecture of @gravity-ui/markdown-editor.

## System Diagram

```mermaid
flowchart TB
    subgraph Public API
        useMarkdownEditor[useMarkdownEditor Hook]
        MarkdownEditorView[MarkdownEditorView Component]
    end

    subgraph Bundle Layer
        BundleEditor[Editor Instance]
        Config[Toolbar & Preset Config]
    end

    subgraph Core Engine
        WysiwygEditor[WysiwygEditor]
        ContentHandler[ContentHandler]
        ExtensionsManager[ExtensionsManager]
    end

    subgraph Editor Modes
        ProseMirror[ProseMirror\nWYSIWYG Mode]
        CodeMirror[CodeMirror 6\nMarkup Mode]
    end

    subgraph Extensions
        MarkdownExt[Markdown Extensions\nheadings, lists, code, tables]
        YFMExt[YFM Extensions\nalerts, tabs, notes, cuts]
        BehaviorExt[Behavior Extensions\nhistory, clipboard, drag-drop]
    end

    subgraph Parsing Layer
        MarkdownIt[markdown-it\nParser/Serializer]
    end

    useMarkdownEditor --> BundleEditor
    MarkdownEditorView --> BundleEditor
    BundleEditor --> Config
    BundleEditor --> WysiwygEditor
    WysiwygEditor --> ContentHandler
    WysiwygEditor --> ExtensionsManager
    ExtensionsManager --> MarkdownExt
    ExtensionsManager --> YFMExt
    ExtensionsManager --> BehaviorExt
    ContentHandler --> MarkdownIt
    WysiwygEditor --> ProseMirror
    BundleEditor --> CodeMirror
    MarkdownIt --> ProseMirror
    MarkdownIt --> CodeMirror
```

## Main Components

### 1. Public API (`/src/bundle`)

The consumer-facing React API:

| Export | Purpose |
|--------|---------|
| `useMarkdownEditor(options)` | Hook that creates and configures an editor instance |
| `MarkdownEditorView` | React component that renders the editor UI |
| `Editor` | Bundle-level editor class wrapping the core |

### 2. Core Engine (`/src/core`)

The heart of the editor:

| Component | Purpose |
|-----------|---------|
| `WysiwygEditor` | ProseMirror editor wrapper with state management |
| `ContentHandler` | Converts between Markdown ↔ ProseMirror document |
| `ExtensionBuilder` | Configures extensions during initialization |
| `ExtensionsManager` | Manages active extensions at runtime |

### 3. Editor Modes

```mermaid
flowchart LR
    subgraph WYSIWYG Mode
        PM[ProseMirror]
        PMDoc[Document Model]
        PMView[Editor View]
        PM --> PMDoc --> PMView
    end

    subgraph Markup Mode
        CM[CodeMirror 6]
        CMState[Editor State]
        CMView[Editor View]
        CM --> CMState --> CMView
    end

    subgraph Split Mode
        Both[Both editors\nside-by-side]
    end

    ContentHandler[ContentHandler\nMarkdown Serialization]

    PMDoc <--> ContentHandler
    CMState <--> ContentHandler
```

| Mode | Engine | Description |
|------|--------|-------------|
| WYSIWYG | ProseMirror | Rich text editing with toolbar |
| Markup | CodeMirror 6 | Raw markdown with syntax highlighting |
| Split | Both | Side-by-side with synchronized content |

### 4. Extension System (`/src/extensions`)

Extensions are modular plugins that add functionality:

```mermaid
flowchart TB
    subgraph Extension Structure
        Spec[Extension Spec]
        Node[Node Type]
        Mark[Mark Type]
        Commands[Commands]
        Keymap[Keymaps]
        Toolbar[Toolbar Items]
        Parser[Parser Rules]
        Serializer[Serializer Rules]
    end

    Spec --> Node
    Spec --> Mark
    Spec --> Commands
    Spec --> Keymap
    Spec --> Toolbar
    Spec --> Parser
    Spec --> Serializer
```

**Extension Categories:**

| Category | Location | Examples |
|----------|----------|----------|
| Markdown | `/extensions/markdown` | Heading, Bold, Italic, Link, Image, CodeBlock, Table |
| YFM | `/extensions/yfm` | Alerts (Note/Tip/Warning), Tabs, Cuts, File |
| Behavior | `/extensions/behavior` | History, Clipboard, Placeholder, Selection |
| Additional | `/extensions/additional` | HTML, LaTeX, Mermaid, GPT |

### 5. Presets (`/src/presets`)

Pre-configured extension bundles:

| Preset | Description |
|--------|-------------|
| `zero` | Minimal - just paragraphs and line breaks |
| `commonmark` | Standard CommonMark syntax |
| `default` | CommonMark + common extras |
| `yfm` | Yandex Flavored Markdown |
| `full` | All available extensions |

### 6. UI Components

```mermaid
flowchart TB
    subgraph Toolbar
        FlexToolbar[FlexToolbar]
        ToolbarButton[ToolbarButton]
        ToolbarGroup[ToolbarGroup]
        ToolbarListButton[ToolbarListButton]
    end

    subgraph Forms
        LinkForm[LinkForm]
        ImageForm[ImageForm]
        FileForm[FileForm]
    end

    subgraph View
        EditorComponent[Editor Component]
        ModeSwitch[Mode Switcher]
        SplitView[Split View]
    end

    FlexToolbar --> ToolbarButton
    FlexToolbar --> ToolbarGroup
    FlexToolbar --> ToolbarListButton
    EditorComponent --> FlexToolbar
    EditorComponent --> ModeSwitch
    EditorComponent --> SplitView
    ToolbarButton --> Forms
```

## Data Flow

### Content Flow

```mermaid
sequenceDiagram
    participant User
    participant View as MarkdownEditorView
    participant Editor as Editor Instance
    participant PM as ProseMirror
    participant Handler as ContentHandler
    participant MD as markdown-it

    User->>View: Type in WYSIWYG
    View->>PM: Input event
    PM->>PM: Update document
    PM->>Editor: State change

    User->>View: Switch to Markup mode
    View->>Editor: Mode change
    Editor->>Handler: Serialize
    Handler->>MD: ProseMirror → Markdown
    MD-->>Handler: Markdown string
    Handler-->>Editor: Content for CodeMirror

    User->>View: getValue()
    View->>Editor: getValue()
    Editor->>Handler: Serialize current state
    Handler-->>Editor: Markdown string
    Editor-->>View: Return markdown
```

### Event System

The editor emits events for external integration:

| Event | Trigger |
|-------|---------|
| `change` | Content modified |
| `submit` | Ctrl/Cmd+Enter pressed |
| `cancel` | Escape pressed |
| `toolbar-action` | Toolbar button clicked |
| `mode-change` | WYSIWYG ↔ Markup switch |

## Directory Structure

```
src/
├── bundle/           # Public React API
│   ├── Editor.ts
│   ├── useMarkdownEditor.ts
│   ├── MarkdownEditorView.tsx
│   └── config/       # Toolbar configurations
│
├── core/             # Editor engine
│   ├── Editor.ts     # WysiwygEditor
│   ├── ContentHandler.ts
│   ├── ExtensionBuilder.ts
│   ├── ExtensionsManager.ts
│   └── markdown/     # Parsing utilities
│
├── extensions/       # Plugin system
│   ├── base/         # Base implementations
│   ├── markdown/     # Standard markdown
│   ├── yfm/          # YFM-specific
│   ├── behavior/     # Editor behaviors
│   └── additional/   # Optional (HTML, LaTeX, etc.)
│
├── presets/          # Extension bundles
├── toolbar/          # Toolbar components
├── forms/            # Dialog components
├── view/             # React utilities
├── pm/               # ProseMirror re-exports
├── cm/               # CodeMirror re-exports
├── utils/            # Shared utilities
└── styles/           # SCSS stylesheets
```
