import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Video} from './index';
import {video, VideoAttr} from './const';
import {VideoService} from './md-video';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Video, {}),
}).buildDeps();

const {doc, p} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
}) as PMTestBuilderResult<'doc' | 'p'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Video extension', () => {
    it('should parse youtube video', () => {
        same(
            'YouTube @[youtube](dQw4w9WgXcQ)',
            doc(
                p(
                    'YouTube ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.YouTube,
                        [VideoAttr.VideoID]: 'dQw4w9WgXcQ',
                    }),
                ),
            ),
        );
    });

    it('should parse vimeo video', () => {
        same(
            'Vimeo @[vimeo](19706846)',
            doc(
                p(
                    'Vimeo ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Vimeo,
                        [VideoAttr.VideoID]: '19706846',
                    }),
                ),
            ),
        );
    });

    it('should parse vine video', () => {
        same(
            'Vine @[vine](etVpwB7uHlw)',
            doc(
                p(
                    'Vine ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Vine,
                        [VideoAttr.VideoID]: 'etVpwB7uHlw',
                    }),
                ),
            ),
        );
    });

    it('should parse prezi video', () => {
        same(
            'Prezi @[prezi](1kkxdtlp4241)',
            doc(
                p(
                    'Prezi ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Prezi,
                        [VideoAttr.VideoID]: '1kkxdtlp4241',
                    }),
                ),
            ),
        );
    });

    it('should parse osf video', () => {
        same(
            'Osf @[osf](kuvg9)',
            doc(
                p(
                    'Osf ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Osf,
                        [VideoAttr.VideoID]: 'kuvg9',
                    }),
                ),
            ),
        );
    });

    // unsopported by video md plugin
    it.skip('should parse few videos in one paragraph ', () => {
        same(
            'YouTube @[youtube](yt-video-1)' +
                ' Vimeo @[vimeo](vimeo-video-1)' +
                ' Vine @[vine](vine-video-1)' +
                ' Prezi @[prezi](prezi-video-1)' +
                ' Osf @[osf](osf-video-1)' +
                ' videos.',
            doc(
                p(
                    'YouTube ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.YouTube,
                        [VideoAttr.VideoID]: 'yt-video-1',
                    }),
                    ' Vimeo ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Vimeo,
                        [VideoAttr.VideoID]: 'vimeo-video-1',
                    }),
                    ' Vine ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Vine,
                        [VideoAttr.VideoID]: 'vine-video-1',
                    }),
                    ' Prezi ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Vine,
                        [VideoAttr.VideoID]: 'prezi-video-1',
                    }),
                    ' Osf ',
                    schema.node(video, {
                        [VideoAttr.Service]: VideoService.Osf,
                        [VideoAttr.VideoID]: 'osf-video-1',
                    }),
                    ' videos.',
                ),
            ),
        );
    });
});
