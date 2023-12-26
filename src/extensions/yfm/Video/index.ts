import type {Action, ExtensionAuto} from '../../../core';

import {VideoSpecs, VideoSpecsOptions} from './VideoSpecs';
import {VideoService} from './VideoSpecs/md-video';
import {addVideo} from './actions';
import {vAction} from './const';

export {videoNodeName, videoType} from './VideoSpecs';

export type VideoActionAttrs = {
    service: VideoService;
    url: string;
};

export type VideoOptions = VideoSpecsOptions & {};

export const Video: ExtensionAuto<VideoOptions> = (builder, opts) => {
    builder.use(VideoSpecs, opts);

    builder.addAction(vAction, () => addVideo);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [vAction]: Action<VideoActionAttrs>;
        }
    }
}
