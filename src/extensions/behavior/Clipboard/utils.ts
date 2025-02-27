import {Fragment, type Node} from 'prosemirror-model';

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

export function trimListItems(fragment: Fragment): Fragment {
    let modified = false;
    const newChildren: Node[] = [];

    fragment.forEach((contentNode) => {
        if (['bullet_list', 'ordered_list'].includes(contentNode.type.name)) {
            const listItems: Node[] = [];
            let firstNonEmptyFound = false;
            let lastNonEmptyIndex = -1;

            contentNode.forEach((node) => {
                if (node.type.name === 'list_item') {
                    let hasContent = false;

                    node.content.forEach((child) => {
                        if (
                            (child.isText && child.text?.trim().length) ||
                            (!child.isText && child.content.size > 0)
                        ) {
                            hasContent = true;
                        }
                    });

                    if (hasContent) {
                        firstNonEmptyFound = true;
                        lastNonEmptyIndex = listItems.length;
                    } else if (!firstNonEmptyFound) {
                        modified = true;
                        return;
                    }
                }

                listItems.push(node);
            });

            if (lastNonEmptyIndex >= 0 && listItems.length > lastNonEmptyIndex + 1) {
                modified = true;
            }

            if (modified) {
                listItems.length = lastNonEmptyIndex + 1;
            }

            if (listItems.length > 0) {
                newChildren.push(contentNode.copy(Fragment.fromArray(listItems)));
            }
        } else {
            newChildren.push(contentNode);
        }
    });

    return modified ? Fragment.fromArray(newChildren) : fragment;
}
