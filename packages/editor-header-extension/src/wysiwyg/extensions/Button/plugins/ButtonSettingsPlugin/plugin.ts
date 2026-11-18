import {
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {Decoration, DecorationSet} from '@gravity-ui/markdown-editor/pm/view';

import {buttonNodeType} from '../../ButtonSpecs';

/** Whether the settings window of the selected button is open. */
const key = new PluginKey<boolean>('button-settings');
const decorationSpec = {buttonSettings: true};

const selectedButton = ({selection, schema}: EditorState) =>
    selection instanceof NodeSelection && selection.node.type === buttonNodeType(schema)
        ? selection
        : null;

export const setButtonSettingsOpen = (tr: Transaction, open: boolean) => tr.setMeta(key, open);

/** The button view opens its settings window by this decoration. */
export const hasButtonSettings = (decorations: readonly Decoration[]) =>
    decorations.some((decoration) => decoration.spec.buttonSettings === true);

export const buttonSettingsPlugin = () =>
    new Plugin<boolean>({
        key,
        state: {
            init: () => false,
            apply: (tr, open, _oldState, state) =>
                (tr.getMeta(key) ?? open) && selectedButton(state) !== null,
        },
        props: {
            decorations(state) {
                const selection = key.getState(state) && selectedButton(state);
                if (!selection) return null;
                return DecorationSet.create(state.doc, [
                    Decoration.node(selection.from, selection.to, {}, decorationSpec),
                ]);
            },
            handleKeyDown(view, event) {
                const open = key.getState(view.state);
                if (event.key === 'Enter' && !open && selectedButton(view.state)) {
                    view.dispatch(setButtonSettingsOpen(view.state.tr, true));
                    return true;
                }
                if (event.key === 'Escape' && open) {
                    view.dispatch(setButtonSettingsOpen(view.state.tr, false));
                    return true;
                }
                return false;
            },
        },
    });
