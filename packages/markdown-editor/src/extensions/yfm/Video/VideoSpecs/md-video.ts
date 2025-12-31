import video from '@diplodoc/transform/lib/plugins/video/index.js';
export const videoPlugin = video;
export {VideoService, defaults} from '@diplodoc/transform/lib/plugins/video/const.js';
export type {VideoPluginOptions, VideoToken} from '@diplodoc/transform/lib/plugins/video/types.js';
export {parseVideoUrl} from '@diplodoc/transform/lib/plugins/video/parsers.js';
