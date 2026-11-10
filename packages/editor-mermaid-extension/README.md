# Mermaid editor extension

Mermaid diagrams for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): editing of fenced `mermaid` code blocks in the visual editor, a toolbar button for both modes, and rendering of diagrams in the static preview.

Requires React and React DOM 18 or 19. Supports `@gravity-ui/markdown-editor` 15.47.0 and higher. Starting with version 16, the editor does not include Mermaid, and this package provides it.

## Installation

```bash
npm install @gravity-ui/markdown-editor-mermaid-extension @diplodoc/mermaid-extension
```

## Usage

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Mermaid} from '@gravity-ui/markdown-editor-mermaid-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) =>
      builder.use(Mermaid, {
        loadRuntimeScript: () => {
          import('@diplodoc/mermaid-extension/runtime');
        },
      }),
  },
});
```

The Markdown plugin for the markup preview comes from `@diplodoc/mermaid-extension`. The setup of the plugin, the static render and the toolbar is described in [How to connect the Mermaid extension](https://gravity-ui.github.io/markdown-editor/extensions/mermaid-extension.html).

| Entry point                                                   | Exports                                                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-mermaid-extension`               | `Mermaid`, `MermaidAction`, the Markdown command `insertMermaidDiagram`, the toolbar button `toolbarMermaidItem` for both modes and its view `mermaidItemView` |
| `@gravity-ui/markdown-editor-mermaid-extension/wysiwyg`       | `Mermaid`, `MermaidAction` and `toolbarMermaidItem` for the visual editor                                                                                      |
| `@gravity-ui/markdown-editor-mermaid-extension/wysiwyg/specs` | `MermaidSpecs`, `MermaidAttrs`, `MermaidConsts`, `mermaidNodeName`, `mermaidNodeType` and `defaultMermaidEntityId`                                             |
| `@gravity-ui/markdown-editor-mermaid-extension/markup`        | `insertMermaidDiagram` and `toolbarMermaidItem` for the Markdown editor                                                                                        |
| `@gravity-ui/markdown-editor-mermaid-extension/view`          | `withMermaid` and `useMermaidRuntime` for the static render                                                                                                    |

`MermaidSpecs` adds only the schema, Markdown parsing and serialization.
`Mermaid` also needs the editor's React renderer, which the standard presets include.

## Migration from `@gravity-ui/markdown-editor`

The entities keep their names. Only the import path changes.

| In `@gravity-ui/markdown-editor` 15                                                                        | In this package                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Mermaid`, `MermaidOptions` from `/extensions/additional/Mermaid`                                          | `Mermaid`, `MermaidOptions` from `.` or `/wysiwyg`                                                                                    |
| `MermaidAction` from `/extensions/additional/Mermaid/const`                                                | `MermaidAction` from `.` or `/wysiwyg`                                                                                                |
| `MermaidEntitySharedState` from `/extensions/additional/Mermaid/types`                                     | `MermaidEntitySharedState` from `.` or `/wysiwyg`                                                                                     |
| `MermaidSpecs`, `MermaidSpecsOptions` and the constants from `/extensions/additional/Mermaid/MermaidSpecs` | the same names from `/wysiwyg/specs`                                                                                                  |
| `withMermaid`, `MermaidConfig`, `WithMermaidOptions`, `WithMermaidProps` from `/view/hocs/withMermaid`     | the same names from `/view`                                                                                                           |
| `useMermaidRuntime` from `/view/hocs/withMermaid/useMermaidRuntime`                                        | `useMermaidRuntime` from `/view`                                                                                                      |
| `PluginRuntime` from `/view/hocs/withMermaid/types`                                                        | `PluginRuntime` from `/view`                                                                                                          |
| `TransformMeta` from `/view/hocs/withMermaid/types`                                                        | `TransformMeta` from `@gravity-ui/markdown-editor/view`                                                                               |
| `MarkupCommands.insertMermaidDiagram`                                                                      | `insertMermaidDiagram` from `.` or `/markup`                                                                                          |
| `mermaidItemView` from `/toolbars`                                                                         | `mermaidItemView` from `.`                                                                                                            |
| `mermaidItemWysiwyg`, `mermaidItemMarkup` from `/toolbars`                                                 | `toolbarMermaidItem` from `.`, `/wysiwyg` or `/markup`                                                                                |
| `wMermaidItemData`, `mMermaidButton`, `mMermaidItemData`                                                   | `toolbarMermaidItem` in a [toolbars preset](https://gravity-ui.github.io/markdown-editor/getting-started/toolbars-customization.html) |
| `ActionName.mermaid`                                                                                       | any string key of the preset item, for example `'mermaid'`                                                                            |
| `icons.mermaid`, `MermaidIcon`                                                                             | `LogoMermaid` from `@gravity-ui/icons`                                                                                                |

`MermaidAttrs` is now a constant object; its keys and string values are unchanged. Use `(typeof MermaidAttrs)[keyof typeof MermaidAttrs]` for the attribute value type.
NodeView styles use `.g-md-mermaid-nodeview` and lowercase BEM elements instead of `.g-md-Mermaid` and uppercase elements. Update custom CSS overrides accordingly.

The `mermaid` key of the editor's `menubar` keyset is removed. The package registers its own keyset.
