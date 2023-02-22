import video from '@doc-tools/transform/lib/plugins/video';
export const videoPlugin = video;
export {VideoService, defaults} from '@doc-tools/transform/lib/plugins/video/const';
export type {VideoPluginOptions, VideoToken} from '@doc-tools/transform/lib/plugins/video/types';
export {parseVideoUrl} from '@doc-tools/transform/lib/plugins/video/parsers';
