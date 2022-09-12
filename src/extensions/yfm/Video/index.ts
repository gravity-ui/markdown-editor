import {Action, createExtension, ExtensionAuto} from '../../../core';
import {vAction, video, VideoAttr} from './const';
import {createViewStub, serializeNodeToString} from './utils';
import {addVideo} from './actions';
import {defaults, VideoPluginOptions, VideoService, videoPlugin, VideoToken} from './md-video';
import log from '@doc-tools/transform/lib/log';

export type VideoActionAttrs = {
    service: VideoService;
    url: string;
};

// we don't support osf service
const availableServices: ReadonlySet<string> = new Set([
    VideoService.YouTube,
    VideoService.Vimeo,
    VideoService.Vine,
    VideoService.Prezi,
]);

export {vType as videoType} from './utils';

export type VideoOptions = VideoPluginOptions & {};

export const Video: ExtensionAuto<VideoOptions> = (builder, opts) => {
    const options = {...defaults, ...opts, log};

    builder.configureMd((md) => md.use(videoPlugin, options));
    builder.addNode(video, () => ({
        spec: {
            inline: true,
            atom: true,
            group: 'inline',
            attrs: {[VideoAttr.Service]: {}, [VideoAttr.VideoID]: {}},
            parseDOM: [
                {
                    tag: `span[${VideoAttr.Service}][${VideoAttr.VideoID}]`,
                    getAttrs(dom) {
                        const domElem = dom as HTMLElement;
                        return {
                            [VideoAttr.Service]: domElem.getAttribute(VideoAttr.Service),
                            [VideoAttr.VideoID]: domElem.getAttribute(VideoAttr.VideoID),
                        };
                    },
                },
                {
                    tag: `iframe[${VideoAttr.Service}][${VideoAttr.VideoID}]`,
                    getAttrs(dom) {
                        const domElem = dom as HTMLElement;
                        return {
                            [VideoAttr.Service]: domElem.getAttribute(VideoAttr.Service),
                            [VideoAttr.VideoID]: domElem.getAttribute(VideoAttr.VideoID),
                        };
                    },
                    priority: 100,
                },
            ],
            toDOM(node) {
                const service = node.attrs[VideoAttr.Service];
                const videoId = node.attrs[VideoAttr.VideoID];

                if (availableServices.has(service) || !videoId) {
                    return [
                        'div',
                        {
                            class: 'embed-responsive embed-responsive-16by9',
                        },
                        [
                            'iframe',
                            {
                                class: `embed-responsive-item ${service}-player`,
                                type: 'text/html',
                                width: String(options[service as VideoService].width),
                                height: String(options[service as VideoService].height),
                                src: options.url(service, videoId, options),
                                frameborder: '0',
                                webkitallowfullscreen: '',
                                mozallowfullscreen: '',
                                allowfullscreen: '',
                                [VideoAttr.Service]: service,
                                [VideoAttr.VideoID]: videoId,
                            },
                        ],
                    ];
                }

                return createViewStub(node);
            },
        },
        fromYfm: {
            tokenSpec: {
                name: video,
                type: 'node',
                getAttrs: (tok) => ({
                    [VideoAttr.Service]: (tok as VideoToken).service,
                    [VideoAttr.VideoID]: (tok as VideoToken).videoID,
                }),
            },
        },
        toYfm: (state, node) => {
            state.write(serializeNodeToString(node));
        },
    }));

    builder.addAction(vAction, () => addVideo);
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const VideoE = createExtension<VideoOptions>((b, o = {}) => b.use(Video, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [vAction]: Action<VideoActionAttrs>;
        }
    }
}
