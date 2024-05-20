import {Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {handlePaste} from '../handle-paste';

export const codeBlockPastePlugin = () =>
    new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, e: Event) {
                    if (handlePaste(view, e as ClipboardEvent, Slice.empty)) {
                        e.preventDefault();
                        return true;
                    }
                    return false;
                },
            },
        },
    });
