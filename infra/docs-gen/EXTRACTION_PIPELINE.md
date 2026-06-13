# Extension Extraction Pipeline

```mermaid
flowchart TD
    CLI["extract-extension-data.mjs<br/>Parse CLI options"] --> Extractor["ExtensionExtractor<br/>src/extractor/index.mjs"]
    Extractor --> Categories["Extension categories<br/>src/config.mjs"]
    Categories --> Collect["collectExtensionRefs()<br/>Collect all extension dirs"]
    Collect --> Filter["filterExtensionRefs()<br/>Apply blacklist and --only"]
    Filter --> Scan["scanExtension()<br/>src/extractor/scan.mjs"]

    Scan --> FieldConfig["Docs field config<br/>EXTENSION_DOC_FIELD_CONFIG"]
    Scan --> Files["readExtensionSources()<br/>src/utils.mjs"]
    Files --> Selectors["Source file selectors<br/>src/extractor/source-files.mjs"]
    Selectors --> SourceText["Production source text"]
    Selectors --> TestFiles["Test files"]
    Selectors --> SerializerFiles["Serializer and Specs files"]

    SourceText --> Constants["extractConstants()<br/>src/extractor/constants.mjs"]
    SourceText --> AstScanners["AST source scanners<br/>src/extractor/ast.mjs"]
    SourceText --> Options["Option declarations<br/>src/extractor/options.mjs"]
    SerializerFiles --> SerializerHints["Serializer hints"]
    TestFiles --> MarkupExamples["Markup examples<br/>src/extractor/examples.mjs"]

    Constants --> Schema["Schema names<br/>nodes and marks"]
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

- `index.mjs` collects all extension directories, filters them by blacklist and `--only`, and decides when output is written.
- `scan.mjs` builds one extension record from source files and parser results.
- `source-files.mjs` owns file selection rules.
- `ast.mjs`, `options.mjs`, `examples.mjs`, and `constants.mjs` own TypeScript AST parsing details.
- `output.mjs` and `markdown-gen.mjs` own generated artifacts.
