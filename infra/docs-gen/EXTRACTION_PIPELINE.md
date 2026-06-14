# Extension Extraction Pipeline

```mermaid
flowchart TD
    CLI["extract-extension-data.mjs<br/>Parse CLI options"] --> Extractor["ExtensionExtractor<br/>src/extractor/index.mjs"]
    Extractor --> EntryPoints["Extension entry points<br/>EXTENSION_ENTRY_POINTS"]
    EntryPoints --> Collect["collectExtensionRefs()<br/>src/extractor/extension-refs.mjs"]
    Collect --> AllRefs["Full extension ref list"]
    AllRefs --> Filter["filterExtensionRefs()<br/>Apply blacklist and --only"]
    Filter --> Scan["scanExtension()<br/>src/extractor/scan.mjs"]

    Scan --> FieldConfig["Docs field config<br/>EXTENSION_DOC_FIELD_CONFIG"]
    Scan --> Files["readExtensionSources()<br/>src/extractor/extension-sources.mjs"]
    Files --> Selectors["Source file selectors<br/>src/extractor/source-files.mjs"]
    Selectors --> SourceText["Production source text"]
    Selectors --> TestFiles["Test files"]
    Selectors --> SerializerFiles["Serializer and Specs files"]

    SourceText --> Constants["extractConstants()<br/>src/extractor/constants.mjs"]
    SourceText --> AstBarrel["AST extractor API<br/>src/extractor/ast.mjs"]
    AstBarrel --> AstScanners["Focused AST scanners<br/>src/extractor/ast/*.mjs"]
    SourceText --> Options["Option declarations<br/>src/extractor/options.mjs"]
    SerializerFiles --> SerializerHints["Serializer hints"]
    TestFiles --> MarkupExamples["Markup examples<br/>src/extractor/examples.mjs"]

    Constants --> Schema["Schema names<br/>src/extractor/schema.mjs"]
    AstScanners --> ExtractedFields["Actions, keymaps, input rules,<br/>plugins, md plugins"]
    Options --> ExtractedFields
    FieldConfig --> IR["Extension IR record"]
    Schema --> IR
    ExtractedFields --> IR
    SerializerHints --> IR
    MarkupExamples --> IR

    Extractor --> Presets["Preset membership<br/>src/extractor/presets.mjs"]
    Presets --> IR
    IR --> JsonOut["extensions.json<br/>src/extractor/output.mjs"]
    IR --> MarkdownOut["raw/*.md<br/>output.mjs -> markdown-gen.mjs"]
```

The extractor keeps orchestration and parsing separate:

- `index.mjs` asks `extension-refs.mjs` to collect all configured extension entry points,
  filters them by blacklist and `--only`, and only then scans each remaining extension.
- `scan.mjs` coordinates one extension scan; `extension-sources.mjs`, `schema.mjs`, and `record-fields.mjs` own the focused extraction steps.
- `source-files.mjs` owns file selection rules.
- `ast.mjs` exposes focused AST scanners from `ast/*.mjs`; `options.mjs`, `examples.mjs`, and `constants.mjs` own their TypeScript AST parsing details.
- `output.mjs` and `markdown-gen.mjs` own generated artifacts.
