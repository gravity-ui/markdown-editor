import {createElement} from 'react';

import {expectTypeOf} from 'vitest';

import {YfmCodeBlockActions, type YfmCodeBlockActionsProps} from '../../src/extensions';

export function shouldAcceptCodeBlockActionsProps() {
    const props: YfmCodeBlockActionsProps = {
        copyButton: true,
        lineWrappingButton: true,
        codeBlockSelector: '.code-container',
        getCodeBlockText: (element) => element.dataset.code || '',
    };

    return createElement(YfmCodeBlockActions, props);
}

expectTypeOf<NonNullable<YfmCodeBlockActionsProps['getCodeBlockText']>>()
    .parameter(0)
    .toEqualTypeOf<HTMLElement>();
