import isNumber from 'is-number';
import type {Schema} from 'prosemirror-model';

import type {ActionSpec} from '../../../core';
import {type AddImageAttrs as AddImageAttrsBase, imageType} from '../../markdown/Image';

import {ImgSizeAttr} from './const';

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
                    [ImgSizeAttr.Src]: src,
                    [ImgSizeAttr.Title]: title ?? '',
                    [ImgSizeAttr.Alt]: alt ?? '',
                };

                if (isNumber(width)) {
                    imgAttrs[ImgSizeAttr.Width] = String(width);
                }
                if (isNumber(height)) {
                    imgAttrs[ImgSizeAttr.Height] = String(height);
                }

                dispatch(state.tr.insert(state.selection.from, imageType(schema).create(imgAttrs)));
            }
        },
    };
};
