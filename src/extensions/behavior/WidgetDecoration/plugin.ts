import {Plugin, PluginKey} from 'prosemirror-state';
import {DecorationSet} from 'prosemirror-view';

import type {Meta, WidgetSpec} from './types';

export const widgetDecorationPluginKey = new PluginKey<DecorationSet>();

export const WidgetDecorationPlugin = () => {
    return new Plugin<DecorationSet>({
        key: widgetDecorationPluginKey,
        props: {
            decorations(state) {
                return widgetDecorationPluginKey.getState(state) ?? null;
            },
        },
        state: {
            init() {
                return DecorationSet.empty;
            },
            apply(tr, oldSet) {
                // Adjust decoration positions to changes made by the transaction
                let set = oldSet.map(tr.mapping, tr.doc, {
                    onRemove(spec) {
                        const {descriptor} = spec as WidgetSpec;
                        descriptor.remove();
                    },
                });

                const meta: Meta = tr.getMeta(widgetDecorationPluginKey);

                if (meta?.type === 'add') {
                    const {descriptor} = meta;
                    // @ts-expect-error // TODO
                    const deco = Decoration.widget<WidgetSpec>(
                        descriptor.initPos,
                        descriptor.render.bind(descriptor),
                        {id: descriptor.id, pos: descriptor.initPos, descriptor},
                    );

                    set = set.add(tr.doc, [deco]);
                }

                if (meta?.type === 'remove') {
                    const decos = set.find(
                        undefined,
                        undefined,
                        (spec) => (spec as WidgetSpec).id === meta.id,
                    );
                    decos.forEach((deco) => (deco.spec as WidgetSpec).descriptor.remove());
                    set = set.remove(decos);
                }

                return set;
            },
        },
    });
};
