import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import {type Command, Plugin, PluginKey} from '@gravity-ui/markdown-editor/pm/state';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';

import {setHeaderDimensions} from '../commands';
import {headerControlButtons} from '../const';

import {HeaderSettings} from './HeaderSettings';

/** Position of the header whose settings are open. */
export const headerSettingsKey = new PluginKey<number | null>('headerSettings');

export const openHeaderSettings =
    (pos: number | null): Command =>
    (state, dispatch) => {
        dispatch?.(state.tr.setMeta(headerSettingsKey, pos));
        return true;
    };

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
                return deleted ? null : pos;
            },
        },
        view(view) {
            const close = () => {
                const pos = headerSettingsKey.getState(view.state);
                openHeaderSettings(null)(view.state, view.dispatch);
                const block = typeof pos === 'number' ? view.nodeDOM(pos) : null;
                const settingsButton =
                    block instanceof HTMLElement ? headerControlButtons(block)[0] : undefined;
                (settingsButton ?? view).focus();
            };
            // The panel can render an outdated position, so each change reads the current one.
            const change = (attrs: Partial<HeaderDimensions>) => {
                const pos = headerSettingsKey.getState(view.state);
                if (typeof pos === 'number')
                    setHeaderDimensions(pos, attrs)(view.state, view.dispatch);
            };
            const item = getReactRendererFromState(view.state).createItem('header-settings', () => {
                const pos = headerSettingsKey.getState(view.state);
                return (
                    typeof pos === 'number' && (
                        <HeaderSettings view={view} pos={pos} onClose={close} onChange={change} />
                    )
                );
            });
            return {update: () => item.rerender(), destroy: () => item.remove()};
        },
    });
