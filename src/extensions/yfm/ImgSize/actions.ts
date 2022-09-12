import isNumber from 'is-number';
import type {Schema} from 'prosemirror-model';
import type {ActionSpec} from '../../../core';
import {AddImageAttrs as AddImageAttrsBase, imgType} from '../../markdown/Image';
import {ImageAttr} from './const';

export type AddImageAttrs = AddImageAttrsBase & {
    width?: string | number;
    height?: string | number;
};

export const addImage = (schema: Schema): ActionSpec => {
    return {
        isEnable: (state) => state.selection.empty,
        run(state, dispatch, _view, attrs) {
            const params = attrs as AddImageAttrs | undefined;

            if (params?.src) {
                const {src, title, alt, width, height} = params;
                const imgAttrs: {[key: string]: string} = {
                    [ImageAttr.Src]: src,
                    [ImageAttr.Title]: title ?? '',
                    [ImageAttr.Alt]: alt ?? '',
                };

                if (isNumber(width)) {
                    imgAttrs[ImageAttr.Width] = String(width);
                }
                if (isNumber(height)) {
                    imgAttrs[ImageAttr.Height] = String(height);
                }

                dispatch(state.tr.insert(state.selection.from, imgType(schema).create(imgAttrs)));
            }
        },
    };
};
