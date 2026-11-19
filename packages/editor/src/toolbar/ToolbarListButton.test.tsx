import {ThemeProvider} from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {type Mock, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ToolbarListButton} from './ToolbarListButton';
import type {ToolbarItemData} from './types';

describe('ToolbarListButton', () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;
    let first: Mock<() => void>;
    let second: Mock<() => void>;

    const item = (id: string, exec: () => void, enabled = true): ToolbarItemData<null> => ({
        id,
        icon: {data: () => null},
        title: id,
        exec,
        isActive: () => false,
        isEnable: () => enabled,
    });

    const render = async (data: ToolbarItemData<null>[]) => {
        await act(async () => {
            root.render(
                <ThemeProvider theme="light">
                    <ToolbarListButton
                        editor={null}
                        focus={() => {}}
                        icon={{data: () => null}}
                        title="List"
                        data={data}
                        alwaysActive
                    />
                </ThemeProvider>,
            );
        });
        await act(async () => {
            container.querySelector('button')?.click();
        });
    };

    const menuItem = (name: string) => {
        const element = document.querySelector<HTMLElement>(
            `[role="menuitem"][aria-label="${name}"]`,
        );
        if (!element) throw new Error(`No menu item ${name}`);
        return element;
    };

    const press = async (element: HTMLElement, key: string) => {
        await act(async () => {
            element.focus();
            element.dispatchEvent(
                new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}),
            );
        });
    };

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        first = vi.fn<() => void>();
        second = vi.fn<() => void>();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it.each(['Enter', ' '])('should run the item action on %j', async (key) => {
        await render([item('First', first), item('Second', second)]);
        await press(menuItem('Second'), key);
        expect(second).toHaveBeenCalledTimes(1);
        expect(first).not.toHaveBeenCalled();
    });

    it('should not run a disabled item action on Enter', async () => {
        await render([item('First', first), item('Second', second, false)]);
        await press(menuItem('Second'), 'Enter');
        expect(second).not.toHaveBeenCalled();
    });

    it('should not mark an enabled item as a dialog trigger', async () => {
        await render([item('First', first)]);
        expect(menuItem('First').getAttribute('aria-haspopup')).toBeNull();
    });

    it('should keep a disabled item as the trigger of its hint', async () => {
        await render([{...item('First', first, false), hintWhenDisabled: 'Not available here'}]);
        expect(menuItem('First').getAttribute('aria-haspopup')).toBe('dialog');
    });
});
