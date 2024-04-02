import {keydownHandler} from 'prosemirror-keymap';
import {EditorState, Plugin, PluginSpec, TextSelection} from 'prosemirror-state';
import {EditorProps, EditorView} from 'prosemirror-view';

import {ActionStorage, ExtensionAuto} from '../../../core';
import {isCodeBlock} from '../../../utils/nodes';

import {ContextConfig, TooltipView} from './tooltip';

export type {ContextConfig as SelectionContextConfig} from './tooltip';

export type SelectionContextOptions = {
    config?: ContextConfig;
};

export const SelectionContext: ExtensionAuto<SelectionContextOptions> = (builder, {config}) => {
    if (Array.isArray(config) && config.length > 0) {
        builder.addPlugin(({actions}) => new Plugin(new SelectionTooltip(actions, config)));
    }
};

class SelectionTooltip implements PluginSpec<unknown> {
    private destroyed = false;

    private tooltip: TooltipView;
    private hideTimeoutRef: ReturnType<typeof setTimeout> | null = null;

    private _prevState?: EditorState | null;
    private _isMousePressed = false;

    constructor(actions: ActionStorage, menuConfig: ContextConfig) {
        this.tooltip = new TooltipView(actions, menuConfig);
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
                    this._isMousePressed = true;
                    this.cancelTooltipHiding();
                    this.tooltip.hide(view);

                    const onMouseUp = () => {
                        if (this.destroyed) return;
                        this._isMousePressed = false;
                        this.update(view, this._prevState);
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

    private update(view: EditorView, prevState?: EditorState | null) {
        this._prevState = prevState;
        if (this._isMousePressed) return;

        this._prevState = null;
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
        if (selection.empty || !(selection instanceof TextSelection)) {
            this.tooltip.hide(view);
            return;
        }

        // Hide the tooltip when one side of selection inside codeblock
        if (isCodeBlock(selection.$from.parent) || isCodeBlock(selection.$to.parent)) {
            this.tooltip.hide(view);
            return;
        }

        this.tooltip.show(view, {
            onOutsideClick: () => {
                this.scheduleTooltipHiding(view);
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
