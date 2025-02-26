// Partial realization of Facet from CodeMirror, but for ProseMirror

import {type EditorState, Plugin, PluginKey} from 'prosemirror-state';

import {uniqueId} from '../lodash';

/** @internal @unstable */
export type FacetConfig<Input, Output> = {
    combine: (value: readonly Input[]) => Output;
    static: true;
    name?: string;
};

/** @internal @unstable */
export class Facet<Input, Output = readonly Input[]> {
    static define<Input, Output = readonly Input[]>(
        config: FacetConfig<Input, Output>,
    ): Facet<Input, Output> {
        return new this(config);
    }

    private readonly _combine;
    private readonly _key: PluginKey<Output>;

    private constructor(config: FacetConfig<Input, Output>) {
        this._combine = config.combine;
        this._key = new PluginKey(
            `Facet${config.static ? '_static' : ''}:${config.name || ''}:${uniqueId()}`,
        );
    }

    of(value: Input): Plugin<Output> {
        const output = this._combine([value]);
        return new Plugin<Output>({
            key: this._key,
            state: {
                init: () => output,
                apply: () => output,
            },
        });
    }

    getState(state: EditorState): Output | undefined {
        return this._key.getState(state);
    }
}
