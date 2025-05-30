import type {Action, ExtensionAuto} from '../../../core';

import {VideoSpecs, type VideoSpecsOptions} from './VideoSpecs';
import type {VideoService} from './VideoSpecs/md-video';
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
    namespace WysiwygEditor {
        interface Actions {
            [vAction]: Action<VideoActionAttrs>;
        }
    }
}
