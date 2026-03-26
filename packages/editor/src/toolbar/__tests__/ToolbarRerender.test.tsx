/**
 * Tests for the noRerenderOnUpdate flag in ToolbarGroup.
 *
 * Context
 * -------
 * For item types that embed arbitrary React content — ReactComponent, ReactNode,
 * ReactNodeFn — the toolbar has no knowledge of what is rendered inside. To
 * ensure those items always reflect the current editor state, the toolbar
 * wraps them in <ToolbarUpdateOnRerender> by DEFAULT.
 *
 * <ToolbarUpdateOnRerender> subscribes to the toolbar context's "update" event
 * and calls forceUpdate() every time it fires, so the item's content is
 * re-evaluated even if React's own reconciliation would have skipped it.
 *
 * The "update" event is emitted by <ToolbarWrapToContext> after every render
 * of any ancestor that owns the context (useEffect with no dep-array).
 *
 * Opt-out
 * -------
 * Set noRerenderOnUpdate: true when the item is static (e.g. a copy button
 * whose only job is to read the current text at click time) or when the item
 * manages its own subscriptions and doesn't need the toolbar to drive it.
 * The toolbar then renders the item in a plain <Fragment> instead of inside
 * <ToolbarUpdateOnRerender>, so extra renders triggered by the event bus are
 * completely avoided.
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
import type {ToolbarBaseProps} from '../types';

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
// ToolbarUpdateOnRerender — the default wrapping mechanism
// ---------------------------------------------------------------------------

describe('ToolbarUpdateOnRerender (default wrapping mechanism)', () => {
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
                            return <span>content</span>;
                        }}
                    />
                </ToolbarProvider>,
            );
        });

        expect(renderCount).toBe(1);
    });

    it('re-renders content on each "update" event — this is the default behaviour the flag opts out of', () => {
        const {context, eventBus} = makeContext();
        let renderCount = 0;

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarUpdateOnRerender
                        content={() => {
                            renderCount++;
                            return <span>content</span>;
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
// noRerenderOnUpdate for ReactNodeFn items
// ---------------------------------------------------------------------------

describe('ToolbarButtonGroup – ReactNodeFn', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        ({container, root} = setup());
    });

    afterEach(() => {
        teardown(root, container);
    });

    /**
     * Renders two ReactNodeFn items side-by-side:
     *   - one WITHOUT noRerenderOnUpdate (default: toolbar forces re-renders)
     *   - one WITH    noRerenderOnUpdate (opt-out: toolbar leaves it alone)
     */
    function renderTwoItems() {
        const {context, eventBus} = makeContext();
        let countDefault = 0; // no flag → default forced re-renders
        let countOptOut = 0; // noRerenderOnUpdate: true → no forced re-renders

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'default-rerender',
                                type: ToolbarDataType.ReactNodeFn,
                                width: 28,
                                content: () => {
                                    countDefault++;
                                    return <span>dynamic</span>;
                                },
                            },
                            {
                                id: 'no-rerender',
                                type: ToolbarDataType.ReactNodeFn,
                                width: 28,
                                noRerenderOnUpdate: true,
                                content: () => {
                                    countOptOut++;
                                    return <span>static</span>;
                                },
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        return {
            countDefault: () => countDefault,
            countOptOut: () => countOptOut,
            emitUpdate: () =>
                act(() => {
                    eventBus.emit('update', null);
                }),
        };
    }

    it('both items are rendered once on initial mount', () => {
        const {countDefault, countOptOut} = renderTwoItems();
        expect(countDefault()).toBe(1);
        expect(countOptOut()).toBe(1);
    });

    it('default item (no flag) is re-rendered on each "update" event', () => {
        const {countDefault, emitUpdate} = renderTwoItems();
        emitUpdate();
        expect(countDefault()).toBe(2);
        emitUpdate();
        expect(countDefault()).toBe(3);
    });

    it('opt-out item (noRerenderOnUpdate: true) is NOT re-rendered on "update" events', () => {
        const {countOptOut, emitUpdate} = renderTwoItems();
        emitUpdate();
        emitUpdate();
        emitUpdate();
        // Only the initial render — the event bus never triggers extra renders.
        expect(countOptOut()).toBe(1);
    });

    it('multiple events accumulate only for the default item', () => {
        const {countDefault, countOptOut, emitUpdate} = renderTwoItems();
        emitUpdate();
        emitUpdate();
        emitUpdate();
        expect(countDefault()).toBe(4); // 1 initial + 3 forced
        expect(countOptOut()).toBe(1); // 1 initial only
    });
});

// ---------------------------------------------------------------------------
// noRerenderOnUpdate for ReactNode items
// ---------------------------------------------------------------------------

describe('ToolbarButtonGroup – ReactNode', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        ({container, root} = setup());
    });

    afterEach(() => {
        teardown(root, container);
    });

    it('default item (no flag) is re-rendered on "update" event', () => {
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
                                id: 'default-node',
                                type: ToolbarDataType.ReactNode,
                                width: 28,
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

    it('opt-out item (noRerenderOnUpdate: true) is NOT re-rendered on "update" event', () => {
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
        // Counter is a stable element; without ToolbarUpdateOnRerender forcing a
        // re-render, React reuses the existing fiber and does not re-invoke Counter.
        expect(renderCount).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// noRerenderOnUpdate for ReactComponent items
// ---------------------------------------------------------------------------

describe('ToolbarButtonGroup – ReactComponent', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        ({container, root} = setup());
    });

    afterEach(() => {
        teardown(root, container);
    });

    function makeComponent(counter: {count: number}) {
        // A component that increments a counter on every render.
        const Comp: React.FC<ToolbarBaseProps<unknown>> = () => {
            counter.count++;
            return <span>component</span>;
        };
        return Comp;
    }

    it('default component (no flag) is re-rendered on "update" event', () => {
        const {context, eventBus} = makeContext();
        const counter = {count: 0};
        const Comp = makeComponent(counter);

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'default-component',
                                type: ToolbarDataType.ReactComponent,
                                width: 28,
                                component: Comp,
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        expect(counter.count).toBe(1);
        act(() => {
            eventBus.emit('update', null);
        });
        expect(counter.count).toBe(2);
    });

    it('opt-out component (noRerenderOnUpdate: true) is NOT re-rendered on "update" event', () => {
        const {context, eventBus} = makeContext();
        const counter = {count: 0};
        const Comp = makeComponent(counter);

        act(() => {
            root.render(
                <ToolbarProvider value={context}>
                    <ToolbarButtonGroup
                        editor={{}}
                        focus={() => {}}
                        data={[
                            {
                                id: 'static-component',
                                type: ToolbarDataType.ReactComponent,
                                width: 28,
                                noRerenderOnUpdate: true,
                                component: Comp,
                            },
                        ]}
                    />
                </ToolbarProvider>,
            );
        });

        expect(counter.count).toBe(1);
        act(() => {
            eventBus.emit('update', null);
        });
        expect(counter.count).toBe(1);
    });
});
