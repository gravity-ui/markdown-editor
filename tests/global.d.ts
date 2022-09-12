type PMTestBuilderResult<N extends string, M extends string = ''> = {
    schema: import('prosemirror-model').Schema;
} & Record<N, import('prosemirror-test-builder').NodeBuilder> &
    Record<M, import('prosemirror-test-builder').MarkBuilder>;
