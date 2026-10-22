import {expectTypeOf} from 'vitest';

import {
    YfmCodeBlockActions,
    type YfmCodeBlockActionsProps,
} from '@gravity-ui/markdown-viewer/extensions';

export function Consumer() {
    return (
        <YfmCodeBlockActions
            copyButton
            lineWrappingButton
            codeBlockSelector=".code-container"
            getCodeBlockText={(element) => element.dataset.code || ''}
        />
    );
}

expectTypeOf<NonNullable<YfmCodeBlockActionsProps['getCodeBlockText']>>()
    .parameter(0)
    .toEqualTypeOf<HTMLElement>();
