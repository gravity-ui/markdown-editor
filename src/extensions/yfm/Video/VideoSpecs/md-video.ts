import video from '@diplodoc/transform/lib/plugins/video';
export const videoPlugin = video;
export {VideoService, defaults} from '@diplodoc/transform/lib/plugins/video/const';
export type {VideoPluginOptions, VideoToken} from '@diplodoc/transform/lib/plugins/video/types';
export {parseVideoUrl} from '@diplodoc/transform/lib/plugins/video/parsers';
