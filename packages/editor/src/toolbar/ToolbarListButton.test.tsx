import {ThemeProvider} from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {ToolbarListButton} from './ToolbarListButton';

describe('ToolbarListButton', () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.body.appendChild(document.createElement('div'));
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it.each([
        {state: 'an enabled', enabled: true, called: 1},
        {state: 'a disabled', enabled: false, called: 0},
    ])('should handle Enter on $state item', async ({enabled, called}) => {
        const exec = vi.fn();
        await act(async () =>
            root.render(
                <ThemeProvider lang="en">
                    <ToolbarListButton
                        qa="list"
                        editor={{}}
                        focus={vi.fn()}
                        icon={{data: () => null}}
                        title="List"
                        alwaysActive
                        data={[
                            {
                                id: 'item',
                                title: 'Item',
                                icon: {data: () => null},
                                exec,
                                isActive: () => false,
                                isEnable: () => enabled,
                            },
                        ]}
                    />
                </ThemeProvider>,
            ),
        );
        const button = container.querySelector('[data-qa="list"]');
        assert(button instanceof HTMLElement);
        await act(async () => button.click());

        const item = document.querySelector('[role="menuitem"][aria-label="Item"]');
        assert(item);
        await act(async () =>
            item.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})),
        );

        expect(exec).toHaveBeenCalledTimes(called);
    });
});
