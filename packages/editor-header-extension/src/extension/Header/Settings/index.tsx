import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import {NodeSelection, Plugin, PluginKey} from '@gravity-ui/markdown-editor/pm/state';

import {HeaderSettings} from './HeaderSettings';

/** Position of the header whose settings are open. */
export const headerSettingsKey = new PluginKey<number | null>('headerSettings');

export const headerSettingsPlugin = () =>
    new Plugin<number | null>({
        key: headerSettingsKey,
        state: {
            init: () => null,
            apply(tr, open) {
                const requested: number | null | undefined = tr.getMeta(headerSettingsKey);
                if (requested !== undefined) return requested;
                if (open === null) return null;
                const {pos, deleted} = tr.mapping.mapResult(open);
                return !deleted &&
                    tr.selection instanceof NodeSelection &&
                    tr.selection.from === pos
                    ? pos
                    : null;
            },
        },
        view(view) {
            const renderer = getReactRendererFromState(view.state);
            const close = () => view.dispatch(view.state.tr.setMeta(headerSettingsKey, null));
            let item: ReturnType<typeof renderer.createItem> | undefined;
            function update() {
                if (!view.editable || headerSettingsKey.getState(view.state) === null) {
                    item?.remove();
                    item = undefined;
                } else if (item) item.rerender();
                else
                    item = renderer.createItem('header-settings', () => {
                        const pos = headerSettingsKey.getState(view.state);
                        return (
                            typeof pos === 'number' && (
                                <HeaderSettings view={view} pos={pos} onClose={close} />
                            )
                        );
                    });
            }
            update();
            return {update, destroy: () => item?.remove()};
        },
    });
