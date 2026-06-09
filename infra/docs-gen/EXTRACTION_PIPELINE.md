# Extension Extraction Pipeline

```mermaid
flowchart TD
    CLI["extract-extension-data.mjs<br/>Parse CLI options"] --> Extractor["ExtensionExtractor<br/>src/extractor/index.mjs"]
    Extractor --> Categories["Extension categories<br/>src/config.mjs"]
    Categories --> ScanAll["scanAll()<br/>Skip internal extensions"]
    ScanAll --> Scan["scanExtension()<br/>src/extractor/scan.mjs"]

    Scan --> Files["readExtensionSources()<br/>src/utils.mjs"]
    Files --> Selectors["Source file selectors<br/>src/extractor/source-files.mjs"]
    Selectors --> SourceText["Production source text"]
    Selectors --> TestFiles["Test files"]
    Selectors --> SerializerFiles["Serializer and Specs files"]

    SourceText --> Constants["extractConstants()<br/>src/extractor/constants.mjs"]
    SourceText --> RegexScanners["Source scanners<br/>src/extractor/regex.mjs + patterns.mjs"]
    SerializerFiles --> SerializerHints["Serializer hints"]
    TestFiles --> MarkupExamples["Markup examples"]

    Constants --> Schema["Schema names<br/>nodes and marks"]
    RegexScanners --> ExtractedFields["Actions, keymaps, input rules,<br/>plugins, md plugins, options"]
    Schema --> IR["Extension IR record"]
    ExtractedFields --> IR
    SerializerHints --> IR
    MarkupExamples --> IR

    Extractor --> Presets["Preset membership<br/>src/extractor/presets.mjs"]
    Presets --> IR
    IR --> JsonOut["extensions.json<br/>src/extractor/output.mjs"]
    IR --> MarkdownOut["raw/*.md<br/>output.mjs -> markdown-gen.mjs"]
```

The extractor keeps orchestration and parsing separate:

- `index.mjs` decides which extension directories are scanned and when output is written.
- `scan.mjs` builds one extension record from source files and parser results.
- `source-files.mjs` owns file selection rules.
- `regex.mjs`, `constants.mjs`, and `patterns.mjs` own source parsing details.
- `output.mjs` and `markdown-gen.mjs` own generated artifacts.
