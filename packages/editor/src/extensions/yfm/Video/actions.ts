import type {ActionSpec} from '../../../core';

import {VideoAttr} from './VideoSpecs/const';
import type {VideoService} from './VideoSpecs/md-video';
import {parseVideoUrl} from './VideoSpecs/md-video';
import {videoType} from './VideoSpecs/utils';

export type VideoActionAttrs = {
    service: VideoService;
    url: string;
};

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
