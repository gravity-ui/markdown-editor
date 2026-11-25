import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import {ImageForm} from './ImageForm';

describe('ImageForm', () => {
    it('should prevent the default action of Enter that submits the link', () => {
        const container = document.createElement('div');
        const root = createRoot(container);
        const onSubmit = vi.fn();
        act(() => root.render(<ImageForm onSubmit={onSubmit} onCancel={vi.fn()} fields={[]} />));
        const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true});
        act(() => {
            container.querySelector('input')?.dispatchEvent(event);
        });
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
        act(() => root.unmount());
    });
});
