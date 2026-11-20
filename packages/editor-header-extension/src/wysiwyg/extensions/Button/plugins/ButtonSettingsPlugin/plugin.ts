import {
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {Decoration, DecorationSet} from '@gravity-ui/markdown-editor/pm/view';

import {buttonNodeType} from '../../ButtonSpecs';

const key = new PluginKey<DecorationSet>('button-settings');
const decorationSpec = {buttonSettings: true};

const selectedButton = ({selection, schema}: EditorState) =>
    selection instanceof NodeSelection && selection.node.type === buttonNodeType(schema)
        ? selection
        : null;

const isSettingsOpen = (state: EditorState) => Boolean(key.getState(state)?.find().length);

export const setButtonSettingsOpen = (tr: Transaction, open: boolean) => tr.setMeta(key, open);

/** The button view opens its settings window by this decoration. */
export const hasButtonSettings = (decorations: readonly Decoration[]) =>
    decorations.some((decoration) => decoration.spec.buttonSettings === true);

export const buttonSettingsPlugin = () =>
    new Plugin<DecorationSet>({
        key,
        state: {
            init: () => DecorationSet.empty,
            apply(tr, decorations, _oldState, state) {
                const selection = selectedButton(state);
                const open: boolean | undefined = tr.getMeta(key);
                if (!selection || open === false) return DecorationSet.empty;
                if (open) {
                    return DecorationSet.create(state.doc, [
                        Decoration.node(selection.from, selection.to, {}, decorationSpec),
                    ]);
                }
                const mapped = decorations.map(tr.mapping, tr.doc);
                const onSelection = mapped
                    .find(selection.from, selection.to)
                    .some((decoration) => decoration.from === selection.from);
                return onSelection ? mapped : DecorationSet.empty;
            },
        },
        props: {
            decorations: (state) => key.getState(state),
            handleKeyDown(view, event) {
                const open = isSettingsOpen(view.state);
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
