import {forwardRef} from 'react';

import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import {withMermaid} from './index';

describe('withMermaid', () => {
    it('should not activate Mermaid when the runtime is already loaded', async () => {
        const runtime = {
            initialize: vi.fn(),
            run: vi.fn().mockResolvedValue(undefined),
        };
        const callbacks: ((mermaid: typeof runtime) => void)[] = [];
        const subscribe = vi.spyOn(callbacks, 'push').mockImplementation((...subscribers) => {
            subscribers.forEach((subscriber) => subscriber(runtime));
            return 0;
        });
        vi.stubGlobal('mermaidJsonp', callbacks);
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

        const View = forwardRef<HTMLDivElement, {html: string}>(function View({html}, ref) {
            return <div ref={ref} dangerouslySetInnerHTML={{__html: html}} />;
        });
        const Html = withMermaid({runtime: 'mermaid'})(View);
        const container = document.createElement('div');
        const root = createRoot(container);

        try {
            await act(async () => {
                root.render(
                    <Html html="<p>Plain Markdown</p>" meta={{script: []}} mermaidConfig={{}} />,
                );
            });

            expect(subscribe).not.toHaveBeenCalled();
            expect(runtime.initialize).not.toHaveBeenCalled();
            expect(runtime.run).not.toHaveBeenCalled();
        } finally {
            await act(async () => root.unmount());
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        }
    });
});
