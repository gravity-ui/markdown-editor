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

type PluginState = {
    disabled: boolean;
};

type TinyState = Pick<EditorState, 'doc' | 'selection'>;

class SelectionTooltip implements PluginSpec<PluginState> {
    private tooltip: TooltipView;
    private editorView: EditorView | null = null;
    private hideTimeoutRef: ReturnType<typeof setTimeout> | null = null;

    private pressGate: AbortController | null = null;

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
                mousedown: (view) => {
                    this.cancelTooltipHiding();
                    this.tooltip.hide(view);
                    this.gateUpdatesUntilPressEnds(view);
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
            },
        };
    }

    /**
     * A held mouse button moves the selection continuously, so tooltip updates stay gated
     * until the press ends. Not every press ends with a `mouseup` on the page: a native
     * context menu (right-click, ctrl+click on macOS) opens during `mousedown` and swallows
     * the release, and a press that becomes a native drag ends with `dragend` — a keystroke
     * or a new press ends it too. The gate outlives plugin views on purpose: ProseMirror
     * re-creates them whenever `state.plugins` changes identity, which a host can do
     * mid-press.
     */
    private gateUpdatesUntilPressEnds(view: EditorView) {
        this.pressGate?.abort();
        const gate = new AbortController();
        this.pressGate = gate;

        const endPress = () => {
            gate.abort();
            this.pressGate = null;
            // Ignore a release whose editor or plugin instance was replaced mid-press
            if (view.isDestroyed || pluginKey.get(view.state)?.spec !== this) return;
            // Re-evaluated against the current state, not against the one the press
            // started with: the press has hidden the tooltip, and a click that leaves the
            // document and the selection untouched dispatches nothing to bring it back
            this.update(view);
        };

        // Capture phase, so that a stopPropagation() on the way up can't strand the gate
        const options = {capture: true, signal: gate.signal};
        document.addEventListener(
            'mouseup',
            (event) => {
                // a chorded secondary-button release leaves the primary one held
                if (event.buttons === 0) endPress();
            },
            options,
        );
        document.addEventListener('dragend', endPress, options);
        document.addEventListener(
            'keydown',
            (event) => {
                // an auto-repeat comes from a key held since before the press, e.g. shift-drag
                if (!event.repeat) endPress();
            },
            options,
        );
    }

    private update(view: EditorView, prevState?: TinyState) {
        this.editorView = view;

        if (this.pressGate) return;

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
