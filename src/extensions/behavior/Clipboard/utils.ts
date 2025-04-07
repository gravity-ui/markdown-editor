import {Fragment} from 'prosemirror-model';

import {isListItemNode, isListNode} from 'src/extensions/markdown/Lists/utils';
import {isEmptyString} from 'src/utils';

/** Сontains all data formats known to us */
export enum DataTransferType {
    Text = 'text/plain',
    Html = 'text/html',
    Yfm = 'text/yfm', // self
    Rtf = 'text/rtf', // Safari, WebStorm/Intelij
    UriList = 'text/uri-list',
    VSCodeData = 'vscode-editor-data',
    Files = 'Files',
}

export function isIosSafariShare({types}: DataTransfer): boolean {
    // if link is copied from ios safari share button,
    // then data transfer only have text/uri-list data type
    return (
        types.includes(DataTransferType.UriList) &&
        !types.includes(DataTransferType.Text) &&
        !types.includes(DataTransferType.Html)
    );
}

export function isFilesOnly({types}: DataTransfer): boolean {
    return types.length === 1 && types[0] === DataTransferType.Files;
}

export function isFilesFromHtml({types}: DataTransfer): boolean {
    return (
        types.length === 2 &&
        types.includes(DataTransferType.Files) &&
        types.includes(DataTransferType.Html)
    );
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

export function extractTextContentFromHtml(html: string) {
    const element = document.createElement('div');
    element.innerHTML = html;
    element.replaceChildren(...Array.from(element.children).filter((v) => v.nodeName !== 'META'));

    // Look if all nodes are div or span. That they don't have any classname and have only text child.
    if (
        Array.from(element.children).every(({nodeName, classList, childNodes}) => {
            return (
                (nodeName === 'DIV' || nodeName === 'SPAN') &&
                !classList.length &&
                childNodes.length === 1 &&
                (childNodes[0].nodeName === '#text' || childNodes[0].nodeName === 'BR')
            );
        })
    ) {
        return Array.from(element.children).reduce((a, v) => a + v.textContent + '\n', '');
    }

    return null;
}

export function findNotEmptyContentPosses(fragment: Fragment): [number, number, number, number] {
    let firstNodePos = -1;
    let lastNodePos = -1;
    let firstNotEmptyNodePos = -1;
    let lastNotEmptyNodePos = -1;

    fragment.forEach((contentNode, offset) => {
        if (firstNodePos === -1) {
            firstNodePos = offset;
        }
        lastNodePos = offset + contentNode.nodeSize;

        if (!isEmptyString(contentNode)) {
            if (isListNode(contentNode) || isListItemNode(contentNode)) {
                const [start, end] = findNotEmptyContentPosses(contentNode.content);
                if (firstNotEmptyNodePos === -1 && start !== -1) {
                    firstNotEmptyNodePos = offset + start + 1;
                }
                if (end !== -1) {
                    lastNotEmptyNodePos = offset + end + 1;
                }
            } else {
                if (firstNotEmptyNodePos === -1) {
                    firstNotEmptyNodePos = offset;
                }
                lastNotEmptyNodePos = offset + contentNode.nodeSize;
            }
        }
    });

    return [firstNotEmptyNodePos, lastNotEmptyNodePos, firstNodePos, lastNodePos];
}

export function trimContent(fragment: Fragment, creatEmptyFragment?: () => Fragment): Fragment {
    const [notEmptyStart, notEmptyEnd, start, end] = findNotEmptyContentPosses(fragment);

    if (notEmptyStart === start && notEmptyEnd === end) {
        return fragment;
    } else if (notEmptyStart === -1 && notEmptyEnd === -1) {
        return creatEmptyFragment ? creatEmptyFragment() : Fragment.empty;
    }

    return fragment.cut(notEmptyStart, notEmptyEnd);
}
