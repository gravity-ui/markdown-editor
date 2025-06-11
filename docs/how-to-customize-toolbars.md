##### Getting started / Toolbars customization

## How to customize toolbars

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

Base toolbar configurations are available in the `gravity-ui/markdown-editor` repository:

- [`zero`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L109)
- [`commonmark`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L128)
- [`default`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L303)
- [`yfm`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L384)
- [`full`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L517)

### Configuration Details

1. The `items` key contains a shared dictionary used across the four main toolbars.
2. The `orders` key defines the display order of toolbar items.
3. Every ID listed in `orders` must have a corresponding entry in the `items` dictionary.
4. Each item used in a toolbar must also have its corresponding extension included in the editor's `extensions` section.

### Example Configuration

The `default` preset defines a shared `items` dictionary, specifies the display order in `orders`, and connects the corresponding extensions in the `extensions` section.

1. Extension set:
   [src/presets/default.ts#L10](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/presets/default.ts#L10)
2. Toolbar items dictionary:
   [src/modules/toolbars/presets.ts#L308](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L308)
3. Toolbar order definition:
   [src/modules/toolbars/presets.ts#L316](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L316)

### Customizing the Toolbar

The library provides a set of predefined presets that cannot be overridden directly. If none of the built-in presets suit your needs, you can define a custom toolbar configuration. Below is an example of how to do that:

- [Live demo (custom preset)](https://preview.gravity-ui.com/md-editor/?path=/story/extensions-presets--custom)
- [Presets.stories.tsx#L30](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/Presets.stories.tsx#L30)
- [presets.ts#L21](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/presets.ts#L21)

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
