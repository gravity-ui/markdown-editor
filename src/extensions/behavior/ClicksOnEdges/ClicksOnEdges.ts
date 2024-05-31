import {Plugin} from 'prosemirror-state';

import {Action, Extension} from '../../../core';

import {addParagraphToEnd, addParagraphToStart} from './commands';

const startActionName = 'addEmptyDefaultTextblockToStartOfDocument';
const endActionName = 'addEmptyDefaultTextblockToEndOfDocument';

export const ClicksOnEdges: Extension = (builder) => {
    builder.addAction(startActionName, () => ({
        isEnable: addParagraphToStart,
        run: addParagraphToStart,
    }));

    builder.addAction(endActionName, () => ({
        isEnable: addParagraphToEnd,
        run: addParagraphToEnd,
    }));

    builder.addPlugin(() => {
        return new Plugin({
            props: {
                handleClick(view, _pos, event) {
                    if (event.target !== view.dom) return false;

                    const {firstChild, lastChild} = event.target as Node;
                    if (!firstChild || !lastChild) return false;

                    const targetRect = (event.target as Element).getBoundingClientRect();
                    const firstRect = (firstChild as Element).getBoundingClientRect();
                    const lastRect = (lastChild as Element).getBoundingClientRect();

                    const firstOffsetTop = firstRect.top - targetRect.y;
                    const lastOffsetBottom = lastRect.bottom - targetRect.y;

                    if (event.offsetY < firstOffsetTop) {
                        return addParagraphToStart(view.state, view.dispatch);
                    }

                    if (event.offsetY > lastOffsetBottom) {
                        return addParagraphToEnd(view.state, view.dispatch);
                    }

                    return false;
                },
            },
        });
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [startActionName]: Action;
            [endActionName]: Action;
        }
    }
}
