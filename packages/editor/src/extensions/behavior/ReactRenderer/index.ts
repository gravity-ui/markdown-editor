import {type EditorState, Plugin, PluginKey} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';
import type {ReactRenderer} from '../../../modules/react-renderer';

// TODO: Remove these compatibility re-exports in the next major release.
export {ReactRenderStorage, ReactRendererComponent} from '../../../modules/react-renderer';
export type {
    ReactRenderer,
    ReactRendererComponentProps,
    RendererItem,
    RenderStorage,
} from '../../../modules/react-renderer';

const key = new PluginKey<ReactRenderer>('reactrenderer');
export function getReactRendererFromState(state: EditorState): ReactRenderer {
    const renderer = key.getState(state);
    if (!renderer) {
        throw new Error(
            'ReactRenderer is missing in the editor state. Probably, you forgot to use ReactRendererExtension',
        );
    }
    return renderer;
}

export const ReactRendererExtension: ExtensionAuto<ReactRenderer> = (builder, renderer) => {
    builder.context.set('reactrenderer', renderer);
    builder.addPlugin(
        () =>
            new Plugin({
                key,
                state: {
                    init: () => renderer,
                    apply: () => renderer,
                },
            }),
        builder.Priority.Highest,
    );
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            reactrenderer: ReactRenderer;
        }
    }
}
