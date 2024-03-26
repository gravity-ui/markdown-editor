import {useThemeType, useThemeValue} from '@gravity-ui/uikit';
import type {RealTheme, ThemeType} from '@gravity-ui/uikit/build/esm/components/theme/types';
import {Plugin} from 'prosemirror-state';

import {EventEmitter, Receiver} from '../../../../utils/event-emitter';
import {getReactRendererFromState} from '../../ReactRenderer';

export type WatcherEventMap = {
    'change-type': ThemeType;
    'change-theme': RealTheme;
};

export interface WatcherReceiver extends Receiver<WatcherEventMap> {
    readonly type: ThemeType;
    readonly theme: RealTheme;
}

export class YCThemeStore extends EventEmitter<WatcherEventMap> implements WatcherReceiver {
    #type: ThemeType = 'light';
    #theme: RealTheme = 'light';

    get type(): ThemeType {
        return this.#type;
    }

    get theme(): RealTheme {
        return this.#theme;
    }

    setType(type: ThemeType): void {
        if (this.#type !== type) {
            this.#type = type;
            this.emit('change-type', type);
        }
    }

    setTheme(theme: RealTheme): void {
        if (this.#theme !== theme) {
            this.#theme = theme;
            this.emit('change-theme', theme);
        }
    }
}

export const ycThemeWatcherPlugin = (themeStore: Pick<YCThemeStore, 'setTheme' | 'setType'>) =>
    new Plugin({
        view: (view) => {
            const item = getReactRendererFromState(view.state).createItem(
                'yc-theme-watcher',
                () => {
                    const type = useThemeType();
                    const theme = useThemeValue();
                    themeStore.setType(type);
                    themeStore.setTheme(theme);
                    return null;
                },
            );
            return {
                destroy() {
                    item.remove();
                },
            };
        },
    });
