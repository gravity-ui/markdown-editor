# AGENTS.md — editor extensions

An extension `Block` in this directory has this layout:

```
Block/
  BlockSpecs/
    index.ts
    const.ts
    BlockSpecs.ts
  BlockNodeView/
    components/
      <React components>
    index.ts
    BlockNodeView.ts
  plugins/
    BlockPlugin/
      index.ts
      plugin.ts
  Block.ts
  index.ts
```

- `Block.ts` holds the extension; every `index.ts` only re-exports.
- `BlockSpecs/` holds the schema, the parser and the serializer; `const.ts` holds node and attribute names.
- A NodeView is a class in `BlockNodeView/`; its React components live in `components/`.
- Class names come from `cn`; element state is a modifier.
- A markdown-it plugin emits one token stream; extra data goes to `token.meta`.
- A markdown-it plugin only parses. The serializer lives in the extension and writes through `state`.
