import {keydownHandler} from 'prosemirror-keymap';
import type {Node} from 'prosemirror-model';
import {
    AllSelection,
    type EditorState,
    Plugin,
    type PluginSpec,
    TextSelection,
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
     *
     * @default 'bottom'
     */
    placement?: 'top' | 'bottom';
    /**
     * Prevents context popup from overflowing
     *
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

type TinyState = Pick<EditorState, 'doc' | 'selection'>;

class SelectionTooltip implements PluginSpec<unknown> {
    private destroyed = false;

    private tooltip: TooltipView;
    private hideTimeoutRef: ReturnType<typeof setTimeout> | null = null;

    private _isMousePressed = false;

    constructor(
        actions: ActionStorage,
        menuConfig: ContextConfig,
        logger: Logger2.ILogger,
        options: SelectionContextOptions,
    ) {
        this.tooltip = new TooltipView(actions, menuConfig, logger, options);
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
                    const startState: TinyState = {
                        doc: view.state.doc,
                        selection: view.state.selection,
                    };
                    this._isMousePressed = true;
                    this.cancelTooltipHiding();
                    this.tooltip.hide(view);

                    const onMouseUp = () => {
                        if (this.destroyed) return;
                        this._isMousePressed = false;
                        this.update(view, startState);
                    };

                    document.addEventListener('mouseup', onMouseUp, {once: true});
                },
            },
        };
    }

    view(view: EditorView) {
        this.update(view);
        return {
            update: this.update.bind(this),
            destroy: () => {
                this.destroyed = true;
                this.cancelTooltipHiding();
                this.tooltip.destroy();
            },
        };
    }

    private update(view: EditorView, prevState?: TinyState) {
        if (this._isMousePressed) return;

        this.cancelTooltipHiding();

        // Don't show tooltip if editor not mounted to the DOM
        // or when view is out of focus
        if (!view.dom.parentNode || !view.hasFocus()) {
            this.tooltip.hide(view);
            return;
        }

        const {state} = view;
        // Don't do anything if the document/selection didn't change
        if (prevState && prevState.doc.eq(state.doc) && prevState.selection.eq(state.selection))
            return;

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

        this.tooltip.show(view, {
            onOpenChange: (_open, _event, reason) => {
                if (reason !== 'escape-key') this.scheduleTooltipHiding(view);
            },
        });
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
