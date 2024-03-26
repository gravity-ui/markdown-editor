import {Fragment, Node, Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {ExtensionAuto} from '../../../core';
import {pType} from '../../../extensions/base';
import {isFilesOnly} from '../Clipboard/utils';

// Custom handler of pasted files to prevent insert a file preview in base64-format into editor's content
export const FilePaste: ExtensionAuto = (builder) => {
    builder.addPlugin(({schema}) => {
        return new Plugin({
            props: {
                handlePaste(view, event) {
                    const {clipboardData} = event;
                    if (!clipboardData || !isFilesOnly(clipboardData)) return false;
                    const nodes: Node[] = [];
                    for (const file of Array.from(clipboardData.files)) {
                        nodes.push(pType(schema).create(null, schema.text(file.name)));
                    }
                    view.dispatch(
                        view.state.tr
                            .replaceSelection(new Slice(Fragment.from(nodes), 0, 0))
                            .scrollIntoView(),
                    );
                    return true;
                },
            },
        });
    }, builder.Priority.Lowest);
};
