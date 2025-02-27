import {Fragment, type Node} from 'prosemirror-model';

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

function isListItemEmpty(node: Node): boolean {
    let isEmpty = true;
    node.content.forEach((child) => {
        if (!isEmptyString(child)) {
            isEmpty = false;
        }
    });
    return isEmpty;
}

export function trimListItems(fragment: Fragment): Fragment {
    let modified = false;
    const newChildren: Node[] = [];

    fragment.forEach((contentNode) => {
        let result = contentNode;

        if (isListNode(contentNode)) {
            const itemsArray: Node[] = Array.from(contentNode.content.content);
            if (itemsArray.length === 0) {
                return;
            }

            const initialStart = 0;
            const initialEnd = itemsArray.length - 1;
            let start = initialStart;
            let end = initialEnd;

            while (start <= end) {
                if (isListItemNode(itemsArray[start])) {
                    if (!isListItemEmpty(itemsArray[start])) {
                        break;
                    }
                    start++;
                }

                if (start <= end && isListItemNode(itemsArray[end])) {
                    if (!isListItemEmpty(itemsArray[end])) {
                        break;
                    }
                    end--;
                }
            }

            if (start !== initialStart || end !== initialEnd) {
                const pos = start > end ? [0, 1] : [start, end + 1];
                result = contentNode.copy(Fragment.fromArray(itemsArray.slice(...pos)));
                modified = true;
            }
        }

        newChildren.push(result);
    });

    return modified ? Fragment.fromArray(newChildren) : fragment;
}
