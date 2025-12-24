##### Getting started / Toolbars customization

## How to customize toolbars

### Understanding Presets

> **Important:** The editor uses two independent types of presets:

1. **Editor Preset** (`MarkdownEditorPreset`) - Defines the set of extensions and functionality available in the WYSIWYG editor. Configured via the `preset` property when initializing the editor.
   - Available values: `'zero'`, `'commonmark'`, `'default'`, `'yfm'`, `'full'`
   - Example: `useMarkdownEditor({ preset: 'default' })`

2. **Toolbar Preset** (`ToolbarsPreset`) - Defines which buttons appear in the toolbars and their order.
   - Configured via the **optional** `toolbarsPreset` property in the `MarkdownEditorView` component
   - Example: `<MarkdownEditorView toolbarsPreset={customToolbarPreset} />`

**How toolbar preset is determined:**

- **If `toolbarsPreset` is NOT provided** – automatically uses the toolbar preset matching the editor preset name
- **If `toolbarsPreset` is provided** – uses your custom toolbar configuration

For example:
```ts
// Editor preset is 'default', toolbar preset is also 'default' (automatic)
const editor = useMarkdownEditor({ preset: 'default' });
<MarkdownEditorView editor={editor} />

// Editor preset is 'default', but toolbar preset is custom (override)
const editor = useMarkdownEditor({ preset: 'default' });
<MarkdownEditorView editor={editor} toolbarsPreset={myCustomToolbar} />
```

### Toolbar Types

The editor currently provides six types of toolbars:

1. Visible toolbar in WYSIWYG mode
2. "Three-dots" menu in WYSIWYG mode
3. Visible toolbar in Markdown mode
4. "Three-dots" menu in Markdown mode
5. Selection-based toolbar in WYSIWYG (appears when text is selected)
6. Slash-triggered toolbar in WYSIWYG (appears when typing `/`)

More details can be found in [issue #508](https://github.com/gravity-ui/markdown-editor/issues/508).

### Toolbar Configuration

Starting from `@gravity-ui/markdown-editor@14.10.2`, all toolbars—except the selection-based and slash-triggered toolbars—are configured using a shared dictionary of items and arrays defining the order of those items.

Built-in **toolbar presets** are available in the `gravity-ui/markdown-editor` repository:

- [`zero`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L109)
- [`commonmark`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L128)
- [`default`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L303)
- [`yfm`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L384)
- [`full`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L517)

> **Note:** These toolbar presets have the same names as editor presets for convenience. When you don't specify `toolbarsPreset`, the editor automatically selects the toolbar preset matching your editor preset name.

### Configuration Details

1. The `items` key contains a shared dictionary used across the four main toolbars.
2. The `orders` key defines the display order of toolbar items.
3. Every ID listed in `orders` must have a corresponding entry in the `items` dictionary.
4. Each item used in a toolbar must also have its corresponding extension included in the editor's `extensions` section.

### Example Configuration

The `default` **editor preset** defines a set of extensions, while the `default` **toolbar preset** defines the toolbar configuration:

1. **Editor preset** - Extension set:
   [src/presets/default.ts#L10](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/presets/default.ts#L10)
2. **Toolbar preset** - Toolbar items dictionary:
   [src/modules/toolbars/presets.ts#L308](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L308)
3. **Toolbar preset** - Toolbar order definition:
   [src/modules/toolbars/presets.ts#L316](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L316)

### Customizing the Toolbar

The library provides a set of predefined toolbar presets that cannot be overridden directly. If none of the built-in toolbar presets suit your needs, you can define a custom toolbar configuration. Below is an example of how to do that:

- [Live demo (custom preset)](https://preview.gravity-ui.com/md-editor/?path=/story/extensions-presets--custom)
- [Presets.stories.tsx#L30](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/Presets.stories.tsx#L30)
- [presets.ts#L21](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/presets.ts#L21)

#### Step 1: Define your custom toolbar preset

Create a `ToolbarsPreset` object with `items` and `orders`:

```ts
export const toolbarPresets: Record<string, ToolbarsPreset> = {
    custom: {
        items: {
            [Action.undo]: {
                view: undoItemView,
                wysiwyg: undoItemWysiwyg,
                markup: undoItemMarkup,
            },
            [Action.redo]: {
                view: redoItemView,
                wysiwyg: redoItemWysiwyg,
                markup: redoItemMarkup,
            },
            [Action.bold]: {
                view: boldItemView,
                wysiwyg: boldItemWysiwyg,
            },
            [Action.italic]: {
                view: italicItemView,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
        },
        orders: {
            [Toolbar.wysiwygMain]: [[Action.colorify], [Action.bold], [Action.undo, Action.redo]],
            [Toolbar.markupMain]: [[Action.colorify], [Action.italic], [Action.undo, Action.redo]],
        },
    },
};
```

#### Step 2: Use your custom toolbar preset with the editor

```ts
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';
import {toolbarPresets} from './your-toolbar-presets';

function MyEditor() {
    // Initialize editor with an editor preset (defines functionality)
    const editor = useMarkdownEditor({
        preset: 'default', // or 'zero', 'commonmark', 'yfm', 'full'
    });

    return (
        <MarkdownEditorView
            editor={editor}
            toolbarsPreset={toolbarPresets.custom} // Override with custom toolbar preset
        />
    );
}
```

> **Key point:** By providing `toolbarsPreset`, you override the default toolbar configuration. Without it, the editor would use the built-in `'default'` toolbar preset (matching the editor preset name).

### Conditional Toolbar Items

Sometimes you may want to display different sets of toolbar items depending on certain conditions—for example, user permissions. In such cases, you can implement a getter function that returns the appropriate toolbar configuration based on parameters. Example:

```ts
type Falsy = false | 0 | 0n | '' | null | undefined;

export function isTruthy<T>(value: T): value is Exclude<T, Falsy> {
    return Boolean(value);
}

export const getToolbarPresets = ({
    enableColorify,
}): Record<string, ToolbarsPreset> => ({
    custom: {
        items: {
            [Action.undo]: {
                view: undoItemView,
                wysiwyg: undoItemWysiwyg,
                markup: undoItemMarkup,
            },
            [Action.redo]: {
                view: redoItemView,
                wysiwyg: redoItemWysiwyg,
                markup: redoItemMarkup,
            },
            [Action.bold]: {
                view: boldItemView,
                wysiwyg: boldItemWysiwyg,
            },
            [Action.italic]: {
                view: italicItemView,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
        },
        orders: {
            [Toolbar.wysiwygMain]: [
                enableColorify && [Action.colorify],
                [Action.bold],
                [Action.undo, Action.redo],
            ].filter(isTruthy),
            [Toolbar.markupMain]: [
                enableColorify && [Action.colorify],
                [Action.italic],
                [Action.undo, Action.redo],
            ].filter(isTruthy),
        },
    },
});
```
