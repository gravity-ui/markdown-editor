# Extension Extractor Layout

This extractor is intentionally modular from the first PR, even though it currently writes only
the `name` field.

- `config.mjs` defines repository paths and extension entry points.
- `blacklist.mjs` owns internal and public extension skip lists.
- `entry-points.mjs` turns configured entry points into extension refs and applies blacklist
  filtering.
- `source-files.mjs` reads TypeScript/TSX sources for one extension ref.
- `ast/` contains TypeScript AST primitives and source scanners.
- `fields/` contains one controller per extracted field.
- `field-config.mjs` declares the active output fields and connects each field to its controller.
- `index.mjs` orchestrates ref collection, source reading, field extraction, and record creation.
- `output.mjs` writes extracted records to `tmp/docs-gen/extensions.json`.

To add another field later, add its controller under `fields/`, add any focused AST scanner under
`ast/`, then register the field in `field-config.mjs`.
