import {type Command, Plugin, PluginKey, type Transaction} from 'prosemirror-state';

import {Decoration, type DecorationAttrs, DecorationSet, type EditorView} from '#pm/view';

export const DEFAULT_DECORATION_CLASS_NAME = 'link-transform-suggest-deco';

const key = new PluginKey<State>('link-transform-suggest');

const appendTr = {
    open(tr: Transaction, data: Omit<OpenSuggestTrMeta, 'action'>): Transaction {
        const meta: OpenSuggestTrMeta = {...data, action: 'open'};
        return tr.setMeta(key, meta);
    },
    close(tr: Transaction): Transaction {
        const meta: CloseSuggestTrMeta = {action: 'close'};
        return tr.setMeta(key, meta);
    },
} as const;

const closeSuggest: Command = (state, dispatch) => {
    const meta: CloseSuggestTrMeta = {action: 'close'};
    dispatch?.(state.tr.setMeta(key, meta));
    return true;
};

export const SuggestAction = {
    appendTr,
    closeSuggest,
};

type State =
    | {
          active: false;
      }
    | {
          active: true;
          decorations: DecorationSet;
          url: string;
          range: {from: number; to: number};
      };

type OpenSuggestTrMeta = {
    action: 'open';
    url: string;
    from: number;
    to: number;
};

type CloseSuggestTrMeta = {
    action: 'close';
};

type SuggestTrMeta = OpenSuggestTrMeta | CloseSuggestTrMeta;

type LinkTransformSuggestOptions = {
    createHandler: (view: EditorView) => SuggestHandler;
    decorationAttrs?: DecorationAttrs;
};

export interface SuggestHandler {
    open(): void;
    close(): void;
    update(): void;
    destroy(): void;

    onEscape(): boolean;
    onEnter(): boolean;
    onUp(): boolean;
    onDown(): boolean;
}

export function linkTransformSuggest({
    createHandler,
    decorationAttrs,
}: LinkTransformSuggestOptions) {
    let handler: SuggestHandler | null = null;

    return new Plugin<State>({
        key,
        state: {
            init() {
                return {active: false};
            },
            apply(tr, value, oldState, newState) {
                const meta: SuggestTrMeta | undefined = tr.getMeta(key);

                if (meta?.action === 'open') {
                    return {
                        active: true,
                        url: meta.url,
                        range: meta,
                        decorations: DecorationSet.create(tr.doc, [
                            Decoration.inline(
                                meta.from,
                                meta.to,
                                decorationAttrs || {
                                    class: DEFAULT_DECORATION_CLASS_NAME,
                                },
                            ),
                        ]),
                    };
                }

                if (meta?.action === 'close') {
                    return {active: false};
                }

                if (!value.active) return value;

                if (!oldState.selection.eq(newState.selection)) {
                    return {active: false};
                }

                const decoSet = value.decorations.map(tr.mapping, tr.doc);
                const decos = decoSet.find();
                if (!decos.length) return {active: false};
                const {from, to} = decos[0];
                return {...value, decorations: decoSet, range: {from, to}};
            },
        },
        props: {
            handleKeyDown(view, event) {
                const state = this.getState(view.state)!;
                if (!state.active) return false;

                switch (event.key) {
                    case 'Enter':
                    case 'Escape':
                    case 'ArrowUp':
                    case 'ArrowDown':
                    default: {
                        break;
                        // TODO
                    }
                }

                const meta: CloseSuggestTrMeta = {action: 'close'};
                view.dispatch(view.state.tr.setMeta(key, meta));

                return false;
            },
            decorations(state) {
                const pluginState = this.getState(state);
                if (pluginState?.active) return pluginState.decorations;
                return DecorationSet.empty;
            },
        },
        view(view) {
            handler = createHandler(view);
            return {
                update(_0, prevState) {
                    const curr = key.getState(view.state)!;
                    const prev = key.getState(prevState)!;

                    if (!prev.active && curr.active) handler?.open();
                    if (prev.active && !curr.active) handler?.close();
                    if (curr.active) handler?.update();
                },
                destroy() {
                    handler?.destroy();
                    handler = null;
                },
            };
        },
    });
}
