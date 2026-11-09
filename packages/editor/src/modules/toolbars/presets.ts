import {ToolbarName} from './constants';
import {markupToolbarsPresets} from './markup/presets';
import type {ToolbarsPreset} from './types';
import {wysiwygToolbarsPresets} from './wysiwyg/presets';

const toolbarOrder = [
    ToolbarName.wysiwygMain,
    ToolbarName.markupMain,
    ToolbarName.wysiwygHidden,
    ToolbarName.markupHidden,
    ToolbarName.wysiwygSelection,
    ToolbarName.wysiwygSlash,
];

export const zero = composePresets(wysiwygToolbarsPresets.zero, markupToolbarsPresets.zero);
export const commonmark = composePresets(
    wysiwygToolbarsPresets.commonmark,
    markupToolbarsPresets.commonmark,
    zero,
);
export const defaultPreset = composePresets(
    wysiwygToolbarsPresets.default,
    markupToolbarsPresets.default,
    commonmark,
);
export const yfm = composePresets(
    wysiwygToolbarsPresets.yfm,
    markupToolbarsPresets.yfm,
    defaultPreset,
);
export const full = composePresets(wysiwygToolbarsPresets.full, markupToolbarsPresets.full, yfm);

function composePresets(
    wysiwyg: ToolbarsPreset,
    markup: ToolbarsPreset,
    base?: ToolbarsPreset,
): ToolbarsPreset {
    const orders = {...wysiwyg.orders, ...markup.orders};

    return {
        items: Object.fromEntries(
            Object.entries(wysiwyg.items).map(([id, wysiwygItem]) => {
                const item = {...wysiwygItem, ...markup.items[id]};
                const inherited = base?.items[id];
                const unchanged =
                    inherited &&
                    inherited.view === item.view &&
                    inherited.wysiwyg === item.wysiwyg &&
                    inherited.markup === item.markup;
                return [id, unchanged ? inherited : item];
            }),
        ),
        orders: Object.fromEntries(
            toolbarOrder.filter((id) => id in orders).map((id) => [id, orders[id]]),
        ),
    };
}
