# Extractor Module Guide

## English

`infra/docs-gen/src/extractor` collects raw extension metadata for documentation. The
pipeline intentionally keeps each step narrow:

- `index.mjs` orchestrates discovery, filtering, scanning, preset enrichment, and output.
- `scan.mjs` builds one extension record from `EXTENSION_DOC_FIELD_CONFIG`.
- `extension-sources.mjs` reads extension source files and builds source text groups.
- `schema.mjs` resolves schema node and mark names from spec source.
- `record-fields.mjs` maps configured raw fields to focused extractor functions.
- `source-files.mjs` chooses source, spec, serializer, and test files.
- `ast.mjs` is the public barrel for AST-based extraction helpers.
- `ast/core.mjs` contains generic TypeScript AST utilities.
- `ast/builder.mjs` recognizes extension builder call chains.
- `ast/actions.mjs`, `ast/schema.mjs`, `ast/keymaps.mjs`, `ast/plugins.mjs`,
  `ast/input-rules.mjs`, `ast/md-plugins.mjs`, and `ast/serializer.mjs` extract one
  metadata family each.
- `constants.mjs` resolves local string constants, enums, and scalar object members.
- `options.mjs` is the public entry for local `*Options` TypeScript declarations.
- `options/declarations.mjs`, `options/fields.mjs`, and `options/resolve.mjs` split option
  parsing, field shaping, and reference resolution.
- `examples.mjs` extracts serializer examples from `same(...)` test helpers.
- `presets.mjs` maps extensions to editor presets.
- `markdown-gen.mjs` and `output.mjs` render and write the raw artifacts.

`EXTENSION_DOC_FIELD_CONFIG` in `../config.mjs` is the contract for which fields are
written and where each field comes from. Add a field there first, then add the matching
extractor in `scan.mjs`.

## Русский

`infra/docs-gen/src/extractor` собирает сырые метаданные расширений для документации.
Пайплайн специально разбит на узкие шаги:

- `index.mjs` управляет обнаружением, фильтрацией, сканированием, пресетами и выводом.
- `scan.mjs` собирает одну запись расширения по `EXTENSION_DOC_FIELD_CONFIG`.
- `extension-sources.mjs` читает source files расширения и собирает группы source text.
- `schema.mjs` резолвит имена schema node и mark из spec source.
- `record-fields.mjs` связывает сконфигурированные raw fields с узкими extractor-функциями.
- `source-files.mjs` выбирает source, spec, serializer и test файлы.
- `ast.mjs` публично экспортирует AST-based helper-ы.
- `ast/core.mjs` содержит общие утилиты TypeScript AST.
- `ast/builder.mjs` распознает цепочки вызовов extension builder.
- `ast/actions.mjs`, `ast/schema.mjs`, `ast/keymaps.mjs`, `ast/plugins.mjs`,
  `ast/input-rules.mjs`, `ast/md-plugins.mjs` и `ast/serializer.mjs` извлекают по
  одной группе метаданных.
- `constants.mjs` резолвит локальные строковые константы, enum-ы и scalar object members.
- `options.mjs` публично запускает разбор локальных TypeScript declarations вида `*Options`.
- `options/declarations.mjs`, `options/fields.mjs` и `options/resolve.mjs` разделяют
  parsing declarations, формирование fields и reference resolution.
- `examples.mjs` извлекает serializer examples из test helper-ов `same(...)`.
- `presets.mjs` сопоставляет расширения с editor presets.
- `markdown-gen.mjs` и `output.mjs` рендерят и записывают raw artifacts.

`EXTENSION_DOC_FIELD_CONFIG` в `../config.mjs` задает контракт: какие поля пишутся и
откуда каждое поле берется. Новое поле сначала добавляется туда, затем для него
добавляется extractor в `scan.mjs`.
