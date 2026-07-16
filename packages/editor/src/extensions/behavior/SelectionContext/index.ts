import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {
    AllSelection,
    type EditorState,
    Plugin,
    PluginKey,
    type PluginSpec,
    type StateField,
    TextSelection,
    type Transaction,
} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {hasParentNode} from 'prosemirror-utils';
import type {EditorProps, EditorView} from 'prosemirror-view';

import type {ActionStorage, ExtensionAuto} from '../../../core';
import type {Logger2} from '../../../logger';
import {isCodeBlock} from '../../../utils/nodes';
import {isMac} from '../../../utils/platform';

import {type ContextConfig, TooltipView} from './tooltip';

export type {
    ContextConfig as SelectionContextConfig,
    ContextGroupItemData as SelectionContextItemData,
} from './tooltip';

export type SelectionContextOptions = {
    config?: ContextConfig;
    /**
     * Placement of context popup
     * @default 'bottom'
     */
    placement?: 'top' | 'bottom';
    /**
     * Prevents context popup from overflowing
     * @default false
     */
    flip?: boolean;
};

export const SelectionContext: ExtensionAuto<SelectionContextOptions> = (builder, opts) => {
    const {config} = opts;
    if (Array.isArray(config) && config.length > 0) {
        builder.addPlugin(
            ({actions}) => new Plugin(new SelectionTooltip(actions, config, builder.logger, opts)),
        );
    }
};

const HideMetaKey = 'hide-selection-menu';

export const hideSelectionMenu = (tr: Transaction) => {
    return tr.setMeta(HideMetaKey, true);
};

const pluginKey = new PluginKey<PluginState>('selection-context');

/**
 * A press that may open the native context menu, or any other non-primary press whose
 * release is unreliable. macOS opens the menu during mousedown — swallowing the following
 * mouseup — and reports ctrl+click with button 0
 */
function isContextMenuPress(event: MouseEvent): boolean {
    return event.button !== 0 || (isMac() && event.ctrlKey);
}

type PluginState = {
    disabled: boolean;
};

class SelectionTooltip implements PluginSpec<PluginState> {
    private tooltip: TooltipView;
    private editorView: EditorView | null = null;
    private hideTimeoutRef: ReturnType<typeof setTimeout> | null = null;

    private _releasePressGate: (() => void) | null = null;

    constructor(
        actions: ActionStorage,
        menuConfig: ContextConfig,
        logger: Logger2.ILogger,
        options: SelectionContextOptions,
    ) {
        this.tooltip = new TooltipView(actions, menuConfig, logger, {
            ...options,
            onPopupOpenChange: (_open, _event, reason) => {
                if (reason !== 'escape-key' && this.editorView)
                    this.scheduleTooltipHiding(this.editorView);
            },
        });
    }

    get key(): PluginKey<PluginState> {
        return pluginKey;
    }

    get props(): EditorProps {
        return {
            // same as keymap({})
            handleKeyDown: keydownHandler({
                // hide context menu when Esc was pressed
                Escape: (_state, _dispatch, view) => {
                    if (this.tooltip.isTooltipOpen) {
                        this.tooltip.hide(view!);
                        return true;
                    }
                    return false;
                },
            }),
            handleDOMEvents: {
                mousedown: (view, event) => {
                    this.cancelTooltipHiding();
                    this.tooltip.hide(view);

                    // The native menu may swallow the document mouseup, and the press itself
                    // may select the clicked word. Keep updates gated so the tooltip doesn't
                    // pop up under the menu, and release the gate on the next input that
                    // reaches the page
                    if (isContextMenuPress(event)) {
                        this.armPressGate({
                            mousedown: () => true,
                            keydown: () => true,
                            mouseup: (e) => e.button === 0,
                        });
                        return;
                    }

                    this.armPressGate(
                        // a chorded secondary-button release must not consume the gate
                        {mouseup: (e) => e.button === 0},
                        () => {
                            // Ignore a release whose editor or plugin was replaced while
                            // the button was held
                            if (view.isDestroyed || pluginKey.get(view.state)?.spec !== this) {
                                return;
                            }
                            // Re-evaluate without the mousedown snapshot: mousedown just hid
                            // the tooltip, so an unchanged doc/selection must show it again,
                            // not keep it hidden
                            this.update(view);
                        },
                    );
                },
                // A press that turns into a native drag ends with dragend, not mouseup —
                // release the gate and disarm its listeners here
                dragstart: () => {
                    this._releasePressGate?.();
                },
            },
        };
    }

    get state(): StateField<PluginState> {
        return {
            init: () => ({disabled: false}),
            apply(tr) {
                return {disabled: Boolean(tr.getMeta(HideMetaKey))};
            },
        };
    }

    view(view: EditorView) {
        this.update(view);
        return {
            update: this.update.bind(this),
            destroy: () => {
                this.cancelTooltipHiding();
                this.tooltip.destroy();
                // ProseMirror re-creates plugin views synchronously (destroy, then view())
                // whenever state.plugins changes identity — a press in flight must keep its
                // gate through that. Disarm only on a real editor teardown, so the gate's
                // document listeners don't pin the destroyed view until the next input
                queueMicrotask(() => {
                    if (view.isDestroyed) this._releasePressGate?.();
                });
            },
        };
    }

    private update(view: EditorView, prevState?: EditorState) {
        this.editorView = view;

        // A press interaction is in flight (button held, or a native context menu
        // possibly open) — the gate's release will re-evaluate when it ends
        if (this._releasePressGate) return;

        this.cancelTooltipHiding();

        const hideFromTr = pluginKey.getState(view.state)?.disabled;

        // Don't show tooltip if editor not mounted to the DOM
        if (hideFromTr || !view.dom.parentNode) {
            this.tooltip.hide(view);
            return;
        }

        const {state} = view;
        // Don't do anything if the document/selection didn't change
        if (prevState && prevState.doc.eq(state.doc) && prevState.selection.eq(state.selection)) {
            return;
        }

        // Don't show tooltip if editor out of focus
        if (!view.hasFocus()) {
            this.tooltip.hide(view);
            return;
        }

        const {selection} = state;
        // Hide the tooltip if the selection is empty
        if (
            selection.empty ||
            !(selection instanceof TextSelection || selection instanceof AllSelection)
        ) {
            this.tooltip.hide(view);
            return;
        }

        if (
            // Hide tooltip when one side of selection is inside a codeblock
            isCodeBlock(selection.$from.parent) ||
            isCodeBlock(selection.$to.parent) ||
            // or when selection is inside node where context menu is disabled
            hasParentNode((node: Node) => node.type.spec.selectionContext === false)(selection)
        ) {
            this.tooltip.hide(view);
            return;
        }

        this.tooltip.show(view);
    }

    /**
     * Blocks tooltip updates until one of the listed document events passes its release
     * check; arming a new gate releases the previous one. The gate intentionally survives
     * plugin view re-creations (its release is the only reliable end of a press
     * interaction) — only a real editor teardown disarms it early
     */
    private armPressGate(
        releaseOn: {
            [K in 'mousedown' | 'keydown' | 'mouseup']?: (e: DocumentEventMap[K]) => boolean;
        },
        onRelease?: () => void,
    ) {
        this._releasePressGate?.();

        const controller = new AbortController();
        const release = () => {
            controller.abort();
            this._releasePressGate = null;
        };
        this._releasePressGate = release;

        for (const [type, shouldRelease] of Object.entries(releaseOn)) {
            document.addEventListener(
                type,
                (event) => {
                    if (!(shouldRelease as (e: Event) => boolean)(event)) return;
                    release();
                    onRelease?.();
                },
                {capture: true, signal: controller.signal},
            );
        }
    }

    private scheduleTooltipHiding(view: EditorView) {
        this.hideTimeoutRef = setTimeout(() => {
            // hide tooltip if view is out of focus after 30 ms
            if (!view.hasFocus()) {
                this.tooltip.hide(view);
            }
        }, 30);
    }

    private cancelTooltipHiding() {
        if (this.hideTimeoutRef !== null) {
            clearTimeout(this.hideTimeoutRef);
            this.hideTimeoutRef = null;
        }
    }
}

declare module 'prosemirror-model' {
    interface NodeSpec {
        /** Set false to disable the selection-context menu within this node */
        selectionContext?: boolean | undefined;
    }
}
