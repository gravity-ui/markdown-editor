/**
 * Tests for noRerenderOnUpdate flag in ToolbarGroup.
 *
 * Background: toolbar items of type ReactNode / ReactNodeFn are normally wrapped in
 * <ToolbarUpdateOnRerender>, which subscribes to the toolbar context's "update" event bus
 * and calls forceUpdate() every time the event fires.  That event is emitted by
 * <ToolbarWrapToContext> after every render of any ancestor that owns the context, causing
 * the toolbar items to re-render even when nothing about them actually changed.
 *
 * For fully static items (e.g. a ClipboardButton that just copies fixed text) this is
 * wasteful and can break internal state (e.g. the "Copied!" flash resets on every keystroke).
 *
 * The fix: set noRerenderOnUpdate: true on the item descriptor.  ToolbarButtonGroup then
 * renders the item in a plain <Fragment> instead of inside <ToolbarUpdateOnRerender>, so the
 * item's content function is called only during regular React tree traversal – never as a
 * side-effect of the event bus.
 */

import React from 'react';
import {act} from 'react-dom/test-utils';
import {createRoot, type Root} from 'react-dom/client';

import {EventEmitter} from 'src/utils/event-emitter';
import {ToolbarProvider} from '../context';
import type {ToolbarContextValue, ToolbarEvents} from '../context';
import {ToolbarUpdateOnRerender} from '../ToolbarRerender';
import {ToolbarButtonGroup} from '../ToolbarGroup';
import {ToolbarDataType} from '../types';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeContext(editor: unknown = {}): {
    context: ToolbarContextValue<unknown>;
    eventBus: EventEmitter<ToolbarEvents>;
} {
    const eventBus = new EventEmitter<ToolbarEvents>();
    return {context: {editor, eventBus}, eventBus};
}

function setup(): {container: HTMLDivElement; root: Root} {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    return {container, root};
}

function teardown(root: Root, container: HTMLDivElement) {
    act(() => {
        root.unmount();
    });
    container.remove();
}

// ---------------------------------------------------------------------------
// ToolbarUpdateOnRerender unit tests
// ---------------------------------------------------------------------------

describe('ToolbarUpdateOnRerender', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        ({container, root} = setup());
    });

    afterEach(() => {
        teardown(root, container);
    });

    it('renders content on initial mount', () => {
        const {context} = makeContext();
        let renderCount = 0;

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarUpdateOnRerender
                        content={() => {
                            renderCount++;
                            return <span>hi</span>;
                        }}
                    />
                </ToolbarProvider>,
            );
        });

        expect(renderCount).toBe(1);
    });

    it('re-renders content each time "update" event is emitted', () => {
        const {context, eventBus} = makeContext();
        let renderCount = 0;

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarUpdateOnRerender
                        content={() => {
                            renderCount++;
                            return <span>hi</span>;
                        }}
                    />
                </ToolbarProvider>,
            );
        });

        expect(renderCount).toBe(1);

        act(() => {
            eventBus.emit('update', null);
        });
        expect(renderCount).toBe(2);

        act(() => {
            eventBus.emit('update', null);
        });
        expect(renderCount).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// ToolbarButtonGroup – noRerenderOnUpdate behaviour
// ---------------------------------------------------------------------------

describe('ToolbarButtonGroup – noRerenderOnUpdate', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        ({container, root} = setup());
    });

    afterEach(() => {
        teardown(root, container);
    });

    /**
     * Helper that renders a ToolbarButtonGroup with two ReactNodeFn items –
     * one with noRerenderOnUpdate: true and one without – and returns render
     * counters together with a function to emit an "update" event.
     */
    function renderWithTwoItems() {
        const {context, eventBus} = makeContext();
        let countWithFlag = 0;
        let countWithoutFlag = 0;

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'item-with-rerender',
                                type: ToolbarDataType.ReactNodeFn,
                                width: 28,
                                // NO noRerenderOnUpdate → wrapped in ToolbarUpdateOnRerender
                                content: () => {
                                    countWithoutFlag++;
                                    return <span>dynamic</span>;
                                },
                            },
                            {
                                id: 'item-no-rerender',
                                type: ToolbarDataType.ReactNodeFn,
                                width: 28,
                                noRerenderOnUpdate: true,
                                content: () => {
                                    countWithFlag++;
                                    return <span>static</span>;
                                },
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        return {
            countWithFlag: () => countWithFlag,
            countWithoutFlag: () => countWithoutFlag,
            emitUpdate: () =>
                act(() => {
                    eventBus.emit('update', null);
                }),
        };
    }

    it('both items render once on initial mount', () => {
        const {countWithFlag, countWithoutFlag} = renderWithTwoItems();
        expect(countWithoutFlag()).toBe(1);
        expect(countWithFlag()).toBe(1);
    });

    it('item WITHOUT noRerenderOnUpdate re-renders on "update" event', () => {
        const {countWithoutFlag, emitUpdate} = renderWithTwoItems();
        const before = countWithoutFlag();
        emitUpdate();
        expect(countWithoutFlag()).toBe(before + 1);
    });

    it('item WITH noRerenderOnUpdate does NOT re-render on "update" event', () => {
        const {countWithFlag, emitUpdate} = renderWithTwoItems();
        const before = countWithFlag();
        emitUpdate();
        expect(countWithFlag()).toBe(before); // count must not change
    });

    it('multiple "update" events only affect items without noRerenderOnUpdate', () => {
        const {countWithFlag, countWithoutFlag, emitUpdate} = renderWithTwoItems();

        emitUpdate();
        emitUpdate();
        emitUpdate();

        expect(countWithoutFlag()).toBe(4); // 1 initial + 3 updates
        expect(countWithFlag()).toBe(1); // only initial render
    });

    // ---  ReactNode variant ------------------------------------------------

    it('ReactNode with noRerenderOnUpdate does NOT re-render on "update" event', () => {
        const {context, eventBus} = makeContext();
        let renderCount = 0;

        // ReactNode items hold a static React.ReactNode, not a function.
        // The content is evaluated when the data array is built, so the
        // render counter must live inside a component we embed in content.
        function Counter() {
            renderCount++;
            return <span>node</span>;
        }

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'static-node',
                                type: ToolbarDataType.ReactNode,
                                width: 28,
                                noRerenderOnUpdate: true,
                                content: <Counter />,
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        expect(renderCount).toBe(1);

        act(() => {
            eventBus.emit('update', null);
        });

        // Counter is a stable React element; without ToolbarUpdateOnRerender
        // forcing a re-render, React reuses the existing fiber and does not
        // re-invoke the function component.
        expect(renderCount).toBe(1);
    });

    it('ReactNode without noRerenderOnUpdate re-renders on "update" event', () => {
        const {context, eventBus} = makeContext();
        let renderCount = 0;

        function Counter() {
            renderCount++;
            return <span>node</span>;
        }

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'dynamic-node',
                                type: ToolbarDataType.ReactNode,
                                width: 28,
                                // no noRerenderOnUpdate → wrapped in ToolbarUpdateOnRerender
                                content: <Counter />,
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        expect(renderCount).toBe(1);

        act(() => {
            eventBus.emit('update', null);
        });

        expect(renderCount).toBe(2);
    });
});
