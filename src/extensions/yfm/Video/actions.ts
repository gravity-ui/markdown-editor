import type {ActionSpec} from '../../../core';
import {VideoActionAttrs} from '.';
import {VideoAttr} from './const';
import {parseVideoUrl} from './md-video';
import {vType} from './utils';

export const addVideo: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view, attrs: VideoActionAttrs) {
        if (!attrs || !attrs.service || !attrs.url) {
            return;
        }

        const {service} = attrs;
        const videoID = parseVideoUrl(service, attrs.url);

        dispatch(
            state.tr.insert(
                state.selection.from,
                vType(state.schema).create({
                    [VideoAttr.Service]: service,
                    [VideoAttr.VideoID]: videoID,
                }),
            ),
        );
    },
};
