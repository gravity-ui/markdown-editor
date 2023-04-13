import type {ActionSpec} from '../../../core';
import type {VideoActionAttrs} from './index';
import {VideoAttr} from './VideoSpecs/const';
import {parseVideoUrl} from './VideoSpecs/md-video';
import {videoType} from './VideoSpecs/utils';

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
                videoType(state.schema).create({
                    [VideoAttr.Service]: service,
                    [VideoAttr.VideoID]: videoID,
                }),
            ),
        );
    },
};
