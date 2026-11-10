import {createRoot, type Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useGpt} from './useGpt';

describe('useGpt', () => {
    let root: Root;
    let container: HTMLDivElement;
    let api: ReturnType<typeof useGpt>;
    const onCustomPromptApply = vi.fn(async () => undefined);

    function Harness() {
        api = useGpt({markup: 'original', onCustomPromptApply, onApplyResult: () => {}});
        return null;
    }

    beforeEach(async () => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        root = createRoot(container);
        onCustomPromptApply.mockClear();
        await act(async () => root.render(<Harness />));
        await act(async () => api.handleCustomPromptUpdate('text'));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        vi.unstubAllGlobals();
    });

    it.each([
        {isComposing: true, keyCode: 13, requests: 0},
        {isComposing: false, keyCode: 229, requests: 0},
        {isComposing: false, keyCode: 13, requests: 1},
    ])(
        'sends $requests requests on Enter with isComposing=$isComposing keyCode=$keyCode',
        async ({isComposing, keyCode, requests}) => {
            const nativeEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                isComposing,
                keyCode,
            });

            await act(async () => {
                await api.handleCustomPromptKeyDown({
                    key: 'Enter',
                    code: 'Enter',
                    nativeEvent,
                } as React.KeyboardEvent<HTMLInputElement>);
            });

            expect(onCustomPromptApply).toHaveBeenCalledTimes(requests);
        },
    );
});
