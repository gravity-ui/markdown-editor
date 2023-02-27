import type {Schema} from 'prosemirror-model';
import type {ActionSpec} from '../../../core';
import {imageType} from './ImageSpecs';
import {ImageAttr} from './const';

export type AddImageAttrs = {
    src: string;
    title?: string;
    alt?: string;
};

export const addImage = (schema: Schema): ActionSpec => {
    return {
        isEnable: (state) => state.selection.empty,
        run(state, dispatch, _view, attrs) {
            const params = attrs as AddImageAttrs | undefined;

            if (params?.src) {
                const {src, title, alt} = params;
                const imgAttrs: {[key: string]: string} = {
                    [ImageAttr.Src]: src,
                    [ImageAttr.Title]: title ?? '',
                    [ImageAttr.Alt]: alt ?? '',
                };

                dispatch(state.tr.insert(state.selection.from, imageType(schema).create(imgAttrs)));
            }
        },
    };
};
