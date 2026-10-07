##### Core / Exporters

# Exporters

`WysiwygEditorOptions.exporters` registers named exporter factories. Each factory receives the final `schema` and `logger`, after schema overrides and before plugins, actions, and views.

```ts
import {
  WysiwygEditor,
  type Exporter,
  type ExporterRegistration,
} from '@gravity-ui/markdown-editor/core';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';

const statistics: ExporterRegistration = {
  name: 'statistics',
  create: () => ({
    export(input) {
      return input.childCount;
    },
  }),
};

const editor = new WysiwygEditor({
  extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
  exporters: [statistics],
});
const exporter = editor.getExporter<Exporter<number>>('statistics');
const childCount = exporter.export(editor.parser.parse('Text'));
editor.destroy();
```

- `export(input)` accepts a ProseMirror `Node` or `Fragment`; the exporter defines its result type.
- `getExporter<E>(name)` returns the same instance within one dependency build and preserves methods and overloads of `E`. The caller must match `E` to the registered name.
- Factories run synchronously in configuration order. Registrations cannot change after the build.
- Names are non-empty, case-sensitive, and not trimmed. Duplicate names fail before any factory runs. Failed factories, invalid `export` methods, and unknown names throw errors.

Extensions use `deps.getExporter?.<E>(name)`. The method is optional in `ExtensionDeps` until the next major release. Core always provides it; manually created dependencies may omit it. The function can be destructured.

The existing Markdown serializer and `getValue()` keep their behavior. Public `MarkdownEditor` options do not configure exporters.
