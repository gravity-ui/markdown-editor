import type {Action, ExtensionAuto} from '../../../core';
import {vAction} from './const';
import {addVideo} from './actions';
import {VideoService} from './VideoSpecs/md-video';
import {VideoSpecs, VideoSpecsOptions} from './VideoSpecs';

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
