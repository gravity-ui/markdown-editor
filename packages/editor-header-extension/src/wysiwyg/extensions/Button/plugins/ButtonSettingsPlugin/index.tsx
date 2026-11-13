import {ErrorLoggerBoundary, getReactRendererFromState} from '@gravity-ui/markdown-editor';
import {
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type PluginView,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {buttonNodeType} from '../../ButtonSpecs';

import {ButtonSettings} from './ButtonSettings';

/** Whether the settings window of the selected button is open. */
const key = new PluginKey<boolean>('button-settings');

function selectedButton(state: EditorState): number | null {
    const {selection} = state;
    return selection instanceof NodeSelection &&
        selection.node.type === buttonNodeType(state.schema)
        ? selection.from
        : null;
}

const setOpen = (view: EditorView, open: boolean) =>
    view.dispatch(view.state.tr.setMeta(key, open));

class ButtonSettingsView implements PluginView {
    private view: EditorView;
    private readonly item;

    constructor(view: EditorView) {
        this.view = view;
        this.item = getReactRendererFromState(view.state).createItem('button-settings', () =>
            this.render(),
        );
    }

    update(view: EditorView) {
        this.view = view;
        this.item.rerender();
    }

    destroy() {
        this.item.remove();
    }

    private render() {
        const {view} = this;
        const pos = key.getState(view.state) ? selectedButton(view.state) : null;
        const anchor = pos === null ? null : view.nodeDOM(pos);
        if (pos === null || !(anchor instanceof HTMLElement)) return null;
        return (
            <ErrorLoggerBoundary>
                <ButtonSettings
                    view={view}
                    node={(view.state.selection as NodeSelection).node}
                    pos={pos}
                    anchor={anchor}
                    onClose={(focus) => {
                        setOpen(view, false);
                        if (focus) view.focus();
                    }}
                />
            </ErrorLoggerBoundary>
        );
    }
}

export const buttonSettingsPlugin = () =>
    new Plugin<boolean>({
        key,
        state: {
            init: () => false,
            apply: (tr, open, _oldState, state) =>
                (tr.getMeta(key) ?? open) && selectedButton(state) !== null,
        },
        props: {
            handleClickOn(view, _pos, node, nodePos, _event, direct) {
                if (!direct || node.type !== buttonNodeType(view.state.schema)) return false;
                view.dispatch(
                    view.state.tr
                        .setSelection(NodeSelection.create(view.state.doc, nodePos))
                        .setMeta(key, true),
                );
                return true;
            },
            handleKeyDown(view, event) {
                const open = key.getState(view.state);
                if (event.key === 'Enter' && !open && selectedButton(view.state) !== null) {
                    setOpen(view, true);
                    return true;
                }
                if (event.key === 'Escape' && open) {
                    setOpen(view, false);
                    return true;
                }
                return false;
            },
        },
        view: (view) => new ButtonSettingsView(view),
    });
