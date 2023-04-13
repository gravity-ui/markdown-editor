import type {Node} from 'prosemirror-model';
import {nodeTypeFactory} from '../../../../utils/schema';
import {videoNodeName, VideoAttr} from './const';

export const videoType = nodeTypeFactory(videoNodeName);

export function serializeNodeToString(node: Node) {
    const service = node.attrs[VideoAttr.Service];
    const videoId = node.attrs[VideoAttr.VideoID];

    return `@[${service}](${videoId})`;
}

export function createViewStub(node: Node) {
    const elem = document.createElement('span');
    elem.setAttribute(VideoAttr.Service, node.attrs[VideoAttr.Service]);
    elem.setAttribute(VideoAttr.VideoID, node.attrs[VideoAttr.VideoID]);
    elem.contentEditable = 'false';
    elem.textContent = serializeNodeToString(node);

    return elem;
}
