# Resource replacement follow-up

- [x] Implement the `drop` trigger in ProseMirror and CodeMirror, distinguishing external content from moves inside the editor and preserving resource bindings through native moves and Undo/Redo. Container verification remains below.
- [ ] Add an adapter for external collaboration/history implementations, including reporting resource IDs retained by their Undo/Redo stacks to garbage collection.
- [ ] Extend resource descriptions for multiple URL attributes per node, mark-based resources and custom reference syntax.
- [ ] Add explicit `triggers: ['paste']` to the resource replacement demos and test configurations that previously relied on the default: `Playground.tsx`, `PasteResources.helpers.tsx` and the affected `Editor.test.ts` cases.
- [x] Remove the unused controller subscription infrastructure (`subscribe`, `listeners`, `notify`) and update its tests/documentation.
- [ ] Run the final unit/integration and browser suites in containers, including the new resource collection regressions. Tests have not been run during the current refactoring at the user's request.
