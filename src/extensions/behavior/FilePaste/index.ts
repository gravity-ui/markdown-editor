import {Fragment, type Node, type Schema, Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import {dropPoint} from 'prosemirror-transform';

import type {ExtensionAuto} from '../../../core';
import {pType} from '../../../extensions/base';
import {isFilesOnly} from '../Clipboard/utils';

// Custom handler of pasted (or dropped) files to prevent insert a file preview in base64-format into editor's content (or open file in browser)
export const FilePaste: ExtensionAuto = (builder) => {
    builder.addPlugin(() => {
        return new Plugin({
            props: {
                handlePaste(view, event) {
                    const files = getFiles(event.clipboardData);
                    if (!files) return false;

                    view.dispatch(
                        view.state.tr
                            .replaceSelection(createFilesSlice(view.state.schema, files))
                            .scrollIntoView(),
                    );

                    return true;
                },
                handleDrop(view, event) {
                    if (view.dragging) return false;

                    const files = getFiles(event.dataTransfer);
                    if (!files) return false;

                    const slice = createFilesSlice(view.state.schema, files);

                    const dropPos =
                        view.posAtCoords({left: event.clientX, top: event.clientY})?.pos ?? -1;
                    if (dropPos === -1) return false;

                    const posToInsert = dropPoint(view.state.doc, dropPos, slice);
                    if (posToInsert === null) return false;

                    view.dispatch(view.state.tr.insert(posToInsert, slice.content));
                    return true;
                },
            },
        });
    }, builder.Priority.Lowest);
};

function getFiles(dataTransfer: DataTransfer | null) {
    if (!dataTransfer || !isFilesOnly(dataTransfer)) return null;
    return Array.from(dataTransfer.files);
}

function createFilesSlice(schema: Schema, files: File[]): Slice {
    const nodes: Node[] = [];
    for (const file of files) {
        nodes.push(pType(schema).create(null, schema.text(file.name)));
    }
    return new Slice(Fragment.from(nodes), 0, 0);
}
