import {useLayoutEffect} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {Renderer} from './react';

import {ReactRenderStorage} from './index';

describe('ReactRenderer', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it('should render items created between render and subscription', () => {
        const storage = new ReactRenderStorage();

        function CreateItemOnMount() {
            useLayoutEffect(() => {
                const item = storage.createItem('preview', () => <div>HTML preview</div>);
                return () => item.remove();
            }, []);
            return null;
        }

        act(() => {
            root.render(
                <>
                    <Renderer storage={storage} />
                    <CreateItemOnMount />
                </>,
            );
        });

        expect(storage.getItems()).toHaveLength(1);
        expect(container.textContent).toBe('HTML preview');
    });

    it('should keep rendering storage updates after mounting', () => {
        const storage = new ReactRenderStorage();
        act(() => root.render(<Renderer storage={storage} />));

        let text = 'Original';
        let item: ReturnType<ReactRenderStorage['createItem']>;
        act(() => {
            item = storage.createItem('preview', () => <div>{text}</div>);
        });
        expect(container.textContent).toBe('Original');

        text = 'Updated';
        act(() => item.rerender());
        expect(container.textContent).toBe('Updated');

        act(() => item.remove());
        expect(container.textContent).toBe('');
    });
});
