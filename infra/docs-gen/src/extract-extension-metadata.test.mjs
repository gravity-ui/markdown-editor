import {expect, it} from 'vitest';

import {extractBuilderCalls} from './extract-extension-metadata.mjs';

it('should extract builder calls and resolve local string constants from AST', () => {
    const source = [
        "const actionName = 'bold';",
        "const markName = 'strong';",
        'builder.addAction(actionName, () => {});',
        'builder.addMarkSpec(markName, () => {});',
        'builder.addPlugin(() => {});',
        "other.addAction('unrelated', () => {});",
    ].join('\n');

    expect(extractBuilderCalls(source)).toEqual([
        {method: 'addAction', value: 'bold', expression: null},
        {method: 'addMarkSpec', value: 'strong', expression: null},
        {method: 'addPlugin', value: null, expression: null},
    ]);
});
