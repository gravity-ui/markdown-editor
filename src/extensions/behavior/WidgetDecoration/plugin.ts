import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

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
                    const spec: WidgetSpec = {
                        id: descriptor.id,
                        pos: descriptor.initPos,
                        descriptor,
                    };
                    const deco = Decoration.widget(
                        descriptor.initPos,
                        // @ts-expect-error
                        descriptor.render.bind(descriptor),
                        spec,
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
